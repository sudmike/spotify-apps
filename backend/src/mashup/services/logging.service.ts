import { Injectable } from '@nestjs/common';
import { Log, Logging } from '@google-cloud/logging';

// ---------------------------------------------
// ! Promises are purposefully not awaited
// ---------------------------------------------
export enum LogKey {
  BatchService,
  SpotifyService,
  DatabaseService,
}

@Injectable()
export class LoggingService {
  logging = new Logging();
  batchLog = this.logging.log('batch-service-log');
  spotifyLog = this.logging.log('spotify-service-log');
  databaseLog = this.logging.log('database-service-log');

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
    json.message = `${LogKey[logKey]}: ${message}`;
    if (data) json.data = data;
    if (operation) json.operation = operation;

    // write to log
    const log = this.getLogByKey(logKey);
    if (process.env.NODE_ENV == 'prod')
      log.write(log.entry({ severity }, json));
    else console.log(severity, json);
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
    json.message = `${LogKey[metadata.logKey]}: ${message}`;
    if (data) json.data = data;

    // write to log
    const log = this.getLogByKey(metadata.logKey);
    if (process.env.NODE_ENV == 'prod')
      log.write(log.entry({ severity: metadata.severity }, json));
    else console.log(metadata.severity, json);
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
      case LogKey.BatchService:
        return this.batchLog;
      case LogKey.SpotifyService:
        return this.spotifyLog;
      case LogKey.DatabaseService:
        return this.databaseLog;
    }
  }
}
