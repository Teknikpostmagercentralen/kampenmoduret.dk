import { FirebaseError } from 'firebase/app';

/**
 * Error types for email/password registration.
 */
export enum RegistrationErrorType {
    EmailAlreadyInUse   = 'emailAlreadyInUse',
    InvalidEmail        = 'invalidEmail',
    OperationNotAllowed = 'operationNotAllowed',
    WeakPassword        = 'weakPassword',
    TooManyRequests     = 'tooManyRequests',
    NetworkError        = 'networkError',
    Unknown             = 'unknown',
}

/**
 * Wraps Firebase registration errors into our own domain-specific error.
 */
export class RegistrationError extends Error {
    constructor(
        public readonly type: RegistrationErrorType,
        message?: string
    ) {
        super(message ?? type);
        this.name = 'RegistrationError';
    }

    /**
     * Convert an unknown error (e.g. thrown by createUserWithEmailAndPassword)
     * into a RegistrationError with a friendly message.
     */
    static toRegistrationError(err: unknown): RegistrationError {
        if (err instanceof FirebaseError) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    return new RegistrationError(
                        RegistrationErrorType.EmailAlreadyInUse,
                        'This email is already registered. Please log in or use a different email.'
                    );

                case 'auth/invalid-email':
                    return new RegistrationError(
                        RegistrationErrorType.InvalidEmail,
                        'The email address is not valid. Please check the format and try again.'
                    );

                case 'auth/operation-not-allowed':
                    return new RegistrationError(
                        RegistrationErrorType.OperationNotAllowed,
                        'Email/password accounts are not enabled. Please contact support.'
                    );

                case 'auth/weak-password':
                    return new RegistrationError(
                        RegistrationErrorType.WeakPassword,
                        'The password is too weak. Please choose a stronger password.'
                    );

                case 'auth/too-many-requests':
                    return new RegistrationError(
                        RegistrationErrorType.TooManyRequests,
                        'Too many attempts. Please wait a moment and try again.'
                    );

                case 'auth/network-request-failed':
                    return new RegistrationError(
                        RegistrationErrorType.NetworkError,
                        'Network error. Please check your connection and try again.'
                    );

                default:
                    return new RegistrationError(
                        RegistrationErrorType.Unknown,
                        'An unexpected error occurred during registration. Please try again later.'
                    );
            }
        }

        // non-Firebase errors
        if (err instanceof Error) {
            return new RegistrationError(
                RegistrationErrorType.Unknown,
                err.message
            );
        }

        return new RegistrationError(
            RegistrationErrorType.Unknown,
            String(err)
        );
    }
}