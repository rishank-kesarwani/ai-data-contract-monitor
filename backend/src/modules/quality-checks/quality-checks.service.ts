import { Injectable } from '@nestjs/common';
import {
  Contract,
  QualityCheckResult,
  SchemaSnapshot,
} from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QualityChecksService {
  evaluateChecks(
    contract: Contract,
    snapshot: SchemaSnapshot,
  ): QualityCheckResult[] {
    const results: QualityCheckResult[] = [];
    const timestamp = new Date().toISOString();

    const contractFieldMap = new Map(contract.schema.map((f) => [f.name, f]));
    const snapshotFieldMap = new Map(snapshot.fields.map((f) => [f.name, f]));

    // 1. Check each contracted field against snapshot observed quality
    for (const [name, contractField] of contractFieldMap.entries()) {
      const snapField = snapshotFieldMap.get(name);

      if (!snapField) {
        // Field completely missing is handled in DriftService, but flag quality check if required
        if (contractField.required) {
          results.push({
            id: `qc_${uuidv4().substring(0, 8)}`,
            checkType: 'UNEXPECTED_FIELD',
            field: name,
            passed: false,
            severity: 'CRITICAL',
            threshold: 'Field required in contract',
            observed: 'Field missing in snapshot',
            message: `Required field '${name}' is completely absent in producer snapshot.`,
            timestamp,
          });
        }
        continue;
      }

      // Check A: Null Rate Threshold
      const maxNullRate =
        contractField.constraints?.maxNullRate !== undefined
          ? contractField.constraints.maxNullRate
          : contractField.required || !contractField.nullable
            ? 0.0
            : 0.2; // default 20% max nulls for optional fields

      if (snapField.nullRate > maxNullRate) {
        const pctObserved = (snapField.nullRate * 100).toFixed(1);
        const pctThreshold = (maxNullRate * 100).toFixed(1);
        const severity =
          contractField.required || maxNullRate === 0 ? 'CRITICAL' : 'HIGH';

        results.push({
          id: `qc_${uuidv4().substring(0, 8)}`,
          checkType: 'NULL_RATE',
          field: name,
          passed: false,
          severity,
          threshold: `< ${pctThreshold}% nulls`,
          observed: `${pctObserved}% nulls (${snapField.nullCount} records)`,
          message: `Null rate on '${name}' (${pctObserved}%) exceeds permitted threshold (${pctThreshold}%).`,
          timestamp,
        });
      } else {
        results.push({
          id: `qc_${uuidv4().substring(0, 8)}`,
          checkType: 'NULL_RATE',
          field: name,
          passed: true,
          severity: 'INFO',
          threshold: `<= ${(maxNullRate * 100).toFixed(1)}%`,
          observed: `${(snapField.nullRate * 100).toFixed(1)}%`,
          message: `Null rate for '${name}' is within healthy boundaries.`,
          timestamp,
        });
      }

      // Check B: Type Consistency Check
      if (snapField.inferredType !== contractField.type) {
        results.push({
          id: `qc_${uuidv4().substring(0, 8)}`,
          checkType: 'TYPE_MISMATCH',
          field: name,
          passed: false,
          severity: 'CRITICAL',
          threshold: contractField.type,
          observed: snapField.inferredType,
          message: `Type mismatch on '${name}': Expected '${contractField.type}', observed '${snapField.inferredType}'.`,
          timestamp,
        });
      } else {
        results.push({
          id: `qc_${uuidv4().substring(0, 8)}`,
          checkType: 'TYPE_MISMATCH',
          field: name,
          passed: true,
          severity: 'INFO',
          threshold: contractField.type,
          observed: snapField.inferredType,
          message: `Data type '${snapField.inferredType}' matches contract specification.`,
          timestamp,
        });
      }

      // Check C: Allowed Enum Values Constraint
      if (contractField.constraints?.enum && contractField.constraints.enum.length > 0) {
        const allowedSet = new Set(contractField.constraints.enum.map(String));
        const invalidSamples = (snapField.sampleValues || []).filter(
          (val) => val !== null && val !== undefined && !allowedSet.has(String(val)),
        );

        if (invalidSamples.length > 0) {
          results.push({
            id: `qc_${uuidv4().substring(0, 8)}`,
            checkType: 'VALUE_CONSTRAINT',
            field: name,
            passed: false,
            severity: 'HIGH',
            threshold: `Allowed: [${contractField.constraints.enum.join(', ')}]`,
            observed: `Disallowed samples: [${invalidSamples.join(', ')}]`,
            message: `Observed values outside permitted enum constraint for '${name}'.`,
            timestamp,
          });
        }
      }

      // Check D: Numeric Range Bounds
      if (
        (contractField.type === 'integer' || contractField.type === 'float') &&
        (contractField.constraints?.minimum !== undefined || contractField.constraints?.maximum !== undefined)
      ) {
        const min = contractField.constraints.minimum;
        const max = contractField.constraints.maximum;

        if (min !== undefined && snapField.observedMin !== undefined && Number(snapField.observedMin) < min) {
          results.push({
            id: `qc_${uuidv4().substring(0, 8)}`,
            checkType: 'VALUE_CONSTRAINT',
            field: name,
            passed: false,
            severity: 'HIGH',
            threshold: `>= ${min}`,
            observed: `Observed min: ${snapField.observedMin}`,
            message: `Value on '${name}' (${snapField.observedMin}) drops below minimum constraint (${min}).`,
            timestamp,
          });
        }

        if (max !== undefined && snapField.observedMax !== undefined && Number(snapField.observedMax) > max) {
          results.push({
            id: `qc_${uuidv4().substring(0, 8)}`,
            checkType: 'VALUE_CONSTRAINT',
            field: name,
            passed: false,
            severity: 'HIGH',
            threshold: `<= ${max}`,
            observed: `Observed max: ${snapField.observedMax}`,
            message: `Value on '${name}' (${snapField.observedMax}) exceeds maximum constraint (${max}).`,
            timestamp,
          });
        }
      }
    }

    // 2. Unexpected Fields Check (Strictness Enforcement)
    for (const snapField of snapshot.fields) {
      if (!contractFieldMap.has(snapField.name)) {
        const isStrict = contract.isStrict || contract.compatibilityMode === 'FULL';
        results.push({
          id: `qc_${uuidv4().substring(0, 8)}`,
          checkType: 'UNEXPECTED_FIELD',
          field: snapField.name,
          passed: !isStrict,
          severity: isStrict ? 'HIGH' : 'LOW',
          threshold: isStrict ? 'Strict Schema (No undeclared fields)' : 'Open Evolution Allowed',
          observed: `New field '${snapField.name}' (${snapField.inferredType})`,
          message: isStrict
            ? `Strict contract policy violated: Producer emitted undeclared field '${snapField.name}'.`
            : `Undeclared field '${snapField.name}' detected in payload (Permitted under current compatibility mode).`,
          timestamp,
        });
      }
    }

    return results;
  }
}
