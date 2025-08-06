export const catalog = {
    button_texts: {
        secret_logout_button: "⚠️️ This button will log you out of the game ⚠️️",
        create_another_team_button_text: "Create another team",
        go_back_to_dashboard: 'Go Back to Dashboard'
    },

    screens: {
      deviceCheck: {
          correctness_warning: 'Needs to be correct down to the last second',
          intro_text: 'Please ensure your time is correct before logging into the game',
          local_time: 'Local Time',
          time_zone: 'Timezone',
          end_warning: 'If the time is not correct on the device, it cannot be used for the game.',
          utc_time: 'UTC time'

      }

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
            invalidCredentialsUsername: 'Invalid username or password. Please check and try again.'

        },
        username_example_text: "e.g. chair"
    }
};