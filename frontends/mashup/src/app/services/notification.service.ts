import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private sharedAttributes: MatSnackBarConfig = {
    verticalPosition: 'bottom',
    horizontalPosition: 'end',
    duration: 2500,
  };

  private successAttributes: MatSnackBarConfig = {
    ...this.sharedAttributes,
    panelClass: ['success-snackbar'],
  };
  private infoAttributes: MatSnackBarConfig = {
    ...this.sharedAttributes,
    panelClass: ['info-snackbar'],
  };
  private warningAttributes: MatSnackBarConfig = {
    ...this.sharedAttributes,
    panelClass: ['warning-snackbar'],
  };
  private errorAttributes: MatSnackBarConfig = {
    ...this.sharedAttributes,
    panelClass: ['error-snackbar'],
  };
  private starryAttributes: MatSnackBarConfig = {
    ...this.sharedAttributes,
    panelClass: ['starry-snackbar'],
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Creates a success pop-up with a message.
   * @param message The message that is shown in the toast notification.
   */
  success(message: string) {
    this.snackBar.open(message, undefined, this.successAttributes);
  }

  /**
   * Creates an info pop-up with a message.
   * @param message The message that is shown in the toast notification.
   */
  info(message: string) {
    this.snackBar.open(message, undefined, this.infoAttributes);
  }

  /**
   * Creates a warning pop-up with a message.
   * @param message The message that is shown in the toast notification.
   */
  warning(message: string) {
    this.snackBar.open(message, undefined, this.warningAttributes);
  }

  /**
   * Creates an error pop-up with a message.
   * @param message The message that is shown in the toast notification.
   */
  error(message: string) {
    this.snackBar.open(message, undefined, this.errorAttributes);
  }

  /**
   * Creates a pop-up with a message that has a starry background.
   * @param message The message that is shown in the toast notification.
   */
  starry(message: string) {
    this.snackBar.open(message, undefined, this.starryAttributes);
  }
}
