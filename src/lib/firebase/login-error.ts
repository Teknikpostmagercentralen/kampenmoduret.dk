import {FirebaseError} from "firebase/app";
import {NotValidCredentialsError} from "./firebaseconnection";


/*
All the erros can be found in: https://firebase.google.com/docs/reference/js/auth#autherrorcodes
This class only handles a subset that we selected based on assumpotions about hwo likely they are to occur.
 */
export enum LoginErrorType {
    InvalidCredentials = 'invalidCredentials',
    UserNotFound = 'userNotFound',
    WrongPassword = 'wrongPassword',
    InvalidEmail = 'invalidEmail',
    UserDisabled = 'userDisabled',
    TooManyRequests = 'tooManyRequests',
    NetworkError = 'networkError',
    Unknown = 'unknown',
}

export class LoginError extends Error {
    constructor(
        public readonly type: LoginErrorType,
        message?: string
    ) {
        super(message ?? type);     // fall back to the enum key if no message
        this.name = 'LoginError';
    }


    static toLoginError(err: unknown): LoginError {
        // Custom error from before-your-call
        if (err instanceof NotValidCredentialsError) {
            return new LoginError(
                LoginErrorType.InvalidCredentials,
                'Invalid email or password.'
            );
        }

        // Firebase SDK errors
        if (err instanceof FirebaseError) {
            switch (err.code) {
                case 'auth/user-not-found':
                    return new LoginError(
                        LoginErrorType.UserNotFound,
                        'No user found with this email address.'
                    );
                case 'auth/wrong-password':
                    return new LoginError(
                        LoginErrorType.WrongPassword,
                        'The password you entered is incorrect.'
                    );
                case 'auth/invalid-credential':
                    return new LoginError(
                        LoginErrorType.InvalidCredentials,
                        'The credentials entered was incorrect.'
                    );
                case 'auth/invalid-email':
                    return new LoginError(
                        LoginErrorType.InvalidEmail,
                        'The email address is not properly formatted.'
                    );
                case 'auth/user-disabled':
                    return new LoginError(
                        LoginErrorType.UserDisabled,
                        'This account has been disabled by an administrator.'
                    );
                case 'auth/too-many-requests':
                    return new LoginError(
                        LoginErrorType.TooManyRequests,
                        'Too many attempts. Please try again later.'
                    );
                case 'auth/network-request-failed':
                    return new LoginError(
                        LoginErrorType.NetworkError,
                        'A network error has occurred. Please check your connection and try again.'
                    );
                default:
                    return new LoginError(
                        LoginErrorType.Unknown,
                        'An unknown error occurred. Please try again later.'
                    );
            }
        }

        // Anything else
        return new LoginError(
            LoginErrorType.Unknown,
            err instanceof Error ? err.message : String(err)
        );
    }

}
