import { Injectable } from '@nestjs/common';
import { Log, Logging } from '@google-cloud/logging';

// ---------------------------------------------
// ! Promises are purposefully not awaited
// ---------------------------------------------
export enum LogKey {
  batchService,
}

@Injectable()
export class LoggingService {
  logging = new Logging();
  batchLog = this.logging.log('batch-service-log');

  correlatedLogMetadata: Map<
    string,
    {
      id: string;
      logKey: LogKey;
      operation: string;
      severity: string;
      counter: number;
    }
  > = new Map();

  /**
   * Logs an entry consisting of a message and optionally data.
   * @param logKey LogKey associated with log.
   * @param message Message that should be written to the log.
   * @param data Optional data that should be written to the log.
   * @param operation Descriptor of relating operation.
   * @param severity Severity tag given to log entry. Default is INFO.
   */
  logData(
    logKey: LogKey,
    message: string,
    data: any | undefined = undefined,
    operation: string | undefined,
    severity = 'INFO',
  ) {
    // put together log data
    const json: { [key: string]: any } = {};
    json.message = message;
    if (data) json.data = data;
    if (operation) json.operation = operation;

    // write to log
    const log = this.getLogByKey(logKey);
    log.write(log.entry({ severity }, json));
  }

  /**
   * Starts a correlation between log entries.
   * @param id Id that is used to correlate entries.
   * @param logKey LogKey associated with log.
   * @param operation Descriptor of relating operation.
   * @param severity Severity tag given to log entry. Default is INFO.
   */
  startCorrelatedLog(
    id: string,
    logKey: LogKey,
    operation: string,
    severity = 'INFO',
  ) {
    // update log metadata
    this.correlatedLogMetadata.set(id, {
      id,
      logKey,
      operation,
      severity,
      counter: 0,
    });

    // log starting message
    this.logCorrelatedData(id, `Starting operation "${operation}"`);
  }

  /**
   * Ends the correlation between log entries.
   * @param id Id that is used to correlate entries.
   */
  endCorrelatedLog(id: string) {
    // log ending message
    const metadata = this.correlatedLogMetadata.get(id);
    this.logCorrelatedData(id, `Ending operation "${metadata.operation}"`);

    // update log metadata
    this.correlatedLogMetadata.delete(id);
  }

  /**
   * Logs an entry consisting of a message and optionally data and correlates it to other messages.
   * @param id Id that is used to correlate entries.
   * @param message Message that should be written to the log.
   * @param data Optional data that should be written to the log.
   */
  logCorrelatedData(
    id: string,
    message: string,
    data: any | undefined = undefined,
  ) {
    // get metadata about correlated log
    const metadata = this.correlatedLogMetadata.get(id);

    // put together log data
    const json: { [key: string]: any } = {};
    json.id = id;
    json.operation = metadata.operation;
    json.message = message;
    if (data) json.data = data;

    // write to log
    const log = this.getLogByKey(metadata.logKey);
    log.write(log.entry({ severity: metadata.severity }, json));
    console.log(json);
  }

  /**
   * Generates random string used as ID to correlate log messages.
   */
  generateLogCorrelationId(): string {
    const characters = '0123456789abcdef';
    const idLength = 16;
    let correlationId = '';

    for (let i = 0; i < idLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      correlationId += characters.charAt(randomIndex);
    }

    return correlationId;
  }

  /**
   * Returns concrete log based on abstract logKey,
   * @param logKey LogKey associated with log.
   * @private
   */
  private getLogByKey(logKey: LogKey): Log {
    switch (logKey) {
      case LogKey.batchService:
        return this.batchLog;
    }
  }
}
