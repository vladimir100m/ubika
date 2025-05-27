# Password Reset Functionality

This document describes the password reset functionality implemented in the Ubika real estate web application.

## Overview

The password reset flow consists of the following steps:

1. User clicks "Forgot Password?" link on the login page
2. User enters their email address on the forgot-password page
3. System sends a password reset email with a unique token
4. User clicks the link in the email which takes them to the reset-password page
5. User enters a new password
6. System updates the password and redirects user to login

## Components

### Pages

- **forgot-password.tsx**: Allows users to request a password reset by entering their email address
- **reset-password.tsx**: Allows users to set a new password using a valid reset token

### Context

The `AuthContext.tsx` file has been extended with two new functions:

- `requestPasswordReset(email: string)`: Initiates the password reset process by sending an email
- `resetPassword(token: string, newPassword: string)`: Validates the token and updates the password

### Email Template

The password reset email template is located at `src/templates/password-reset-email.html`. This template includes:

- A header with the Ubika logo
- Instructions for resetting the password
- A prominent reset button
- A fallback URL for users who can't click the button
- Security notice and footer information

## Security Considerations

1. **Token Security**: Reset tokens are unique, random, and expire after 24 hours
2. **Email Privacy**: The system doesn't reveal whether an email exists in the database
3. **Password Requirements**: New passwords must be at least 8 characters long
4. **Rate Limiting**: The system limits the number of reset requests from the same IP address
5. **Secure Communication**: All communications use HTTPS

## Implementation Notes

For this demo version:
- Email sending is simulated 
- Tokens are not actually generated or validated
- Password storage is not implemented securely (in a production app, passwords would be hashed)

In a production environment, these features would be fully implemented with proper security measures.

## Future Enhancements

- Add two-factor authentication
- Implement password strength meter
- Add notification when password is changed
- Allow users to manage active sessions
