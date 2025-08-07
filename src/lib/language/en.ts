export const catalog = {
    general_button_texts: {
        create_another_team_button_text: "Create another team",
        go_back_to_dashboard: 'Go Back to Dashboard'
    },
    game: {
        buttons: {
            secret_logout_button: "⚠️️ This button will log you out of the game ⚠️️",
        }
    },
    admin: {
        headings: {
            game_control: 'Game controls',
            danger: 'Danger zone',
            game_state: 'Game state',
            phase_control: 'Phase control',
            setting_up: 'Setting up the game',
            greeting: 'Hello',
            team_score: 'Team score overall',
            edit_the_value: 'Edit the Value'
        },
        strings: {
            multiplier_new_value_placeholder: 'Enter new value',
            multiplier_help_text: '                        Whole and decimal numbers supported. For example, 1 or 5 or 1.6'

        },
        table: {
          name: 'Name',
          time_left: 'Time Left',
            seconds_earned: 'Seconds Earned',
            nr_of_participants: 'Nr Participants',
            last_task: 'Last Task',

        },
        buttons: {
            stop: 'Stop the game',
            reset: 'Reset the game & delete all progress for teams',
            start: 'Start the game',
            activate: 'Activate the game',
            deactivate: 'Deactivate the game',
            print_qr_button_text: 'Print team QR codes',
            print_tasks: 'Print tasks',
            edit_teams: 'Edit teams',
            add_team: 'Add team',
            edit_tasks: 'Edit tasks',
            add_tasks: 'Add task',
            edit_multiplier_button: 'Edit the Value',
            multiplier_save: 'Save',

        },
        links: {
          log_out: 'Logout'
        },
    },
    screens: {
        printTeamsLogin: {
            beforeScanning: "Before scanning the login QR codes, it is important that each team scans the QR code on the right. It shows a screen with the current time. Check that all phones display the same time.",
            timeWarning: "If one phone does not show the correct time, DO NOT LOG IT IN.",
            gameRisk: "This can break the game for the entire team.",
            qrExplanation: "Each team has a QR code below they can scan to log in.",
            fallbackInfo: "Username and password are also shown in case scanning doesn’t work.",
            qrSecurity: "Make they do not scan another teams’s QR code.",
            autoLoginWarning: "Scanning logs them in automatically",
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
        printTasks: {
            title: 'Task Printout',
            no_task_add_it: "You can add your first task in the dashboard",
            no_tasks: "No tasks found in database",
            loading_tasks: "Loading tasks…",
            QRHeading: 'Task QR codes'
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
            invalidCredentialsUsername: 'Invalid username or password. Please check and try again.',
            invalidEmailUsername: 'The username is not formatted correctly, you probably have characters not allowed in the username'

        },
        username_example_text: "e.g. chair"
    }
};