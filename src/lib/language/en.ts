export const catalog = {
    button_texts: {
        secret_logout_button: "⚠️️ This button will log you out of the game ⚠️️",
        create_another_team_button_text: "Create another team",
        go_back_to_dashboard: 'Go Back to Dashboard'
    },

    screens: {
        printTeamsLogin: {
            beforeScanning: "Before scanning the login QR codes, it is important that each team scans the QR code on the right. It shows a screen with the current time. Check that all phones display the same time.",
            timeWarning: "If one phone does not show the correct time, DO NOT LOG IT IN.",
            gameRisk: "This can break the game for the entire team.",
            qrExplanation: "Each group receives a QR code they can scan to log in.",
            fallbackInfo: "Username and password are also shown in case scanning doesn’t work.",
            qrSecurity: "Make sure not to scan another group’s QR code.",
            autoLoginWarning: "Scanning logs you in automatically, so it’s important that each group uses their own!",
            headlineInfo: 'Information before the game begins'
        },
        deviceCheck: {
            correctness_warning: 'Needs to be correct down to the last second',
            intro_text: 'Please ensure your time is correct before logging into the game',
            local_time: 'Local Time',
            time_zone: 'Timezone',
            end_warning: 'If the time is not correct on the device, it cannot be used for the game.',
            utc_time: 'UTC time'

        },
    },
    registerTeam: {
        errors: {
            invalidEmail: 'The username is not valid. Please check the format and try again.',
            operationNotAllowed: 'Email/password sign-up is not enabled. Please contact support.',
            weakPassword: 'The password is too weak. Please choose a stronger one and ensure it has more that six characters.',
            tooManyRequests: 'Too many attempts. Please wait a moment and try again.',
            networkError: 'A network error occurred. Please check your connection and try again.',
            unknown: 'An unexpected error occurred during registration. Please try again later.'
        },
        fields_not_filled: 'Please fill in a team name, bonus time, and number of participants.'
    },
    login: {
        messages: {
            status_message_logging_you_in: "Logging you in",
            invalid_data_in_request: "The QR code or link you followed was invalid"
        },
        adminLinkText: 'I want to login as admin',
        errors: {
            invalidCredentials: 'Invalid email or password. Please check and try again.',
            userNotFound: 'No user found with this email address.',
            wrongPassword: 'The password you entered is incorrect.',
            invalidEmail: 'The email address is not properly formatted.',
            userDisabled: 'This account has been disabled by an administrator.',
            tooManyRequests: 'We have blocked all requests from this device due to unusual activity. Please try again later.',
            networkError: 'A network error has occurred. Please check your connection and try again.',
            unknown: 'An unknown error occurred. Please try again later.',
            invalidCredentialsUsername: 'Invalid username or password. Please check and try again.',
            invalidEmailUsername: 'The username is not formatted correctly, you probably have characters not allowed in the username'

        },
        username_example_text: "e.g. chair"
    }
};