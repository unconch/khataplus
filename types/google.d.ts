declare namespace google {
    namespace accounts {
        namespace id {
            interface InitializeOptions {
                client_id: string;
                callback: (response: CredentialResponse) => void;
                auto_select?: boolean;
                cancel_on_tap_outside?: boolean;
                prompt_parent_id?: string;
                nonce?: string;
                context?: string;
                state_cookie_domain?: string;
                ux_mode?: 'popup' | 'redirect';
                allowed_parent_origin?: string | string[];
                intermediate_iframe_close_callback?: () => void;
            }

            interface CredentialResponse {
                credential: string;
                select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn_confirm' | 'btn_close';
            }

            interface RenderButtonOptions {
                type?: 'standard' | 'icon';
                shape?: 'rectangular' | 'pill' | 'circle' | 'square';
                theme?: 'outline' | 'filled_blue' | 'filled_black';
                size?: 'large' | 'medium' | 'small';
                text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                width?: string | number;
                locale?: string;
            }

            function initialize(options: InitializeOptions): void;
            function renderButton(parent: HTMLElement, options: RenderButtonOptions): void;
            function prompt(callback?: (notification: PromptMomentNotification) => void): void;
        }
    }
}

interface PromptMomentNotification {
    isDisplayMoment: () => boolean;
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;
    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;
    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
    getMomentType: () => string;
}

interface Window {
    google: typeof google;
    onGoogleLibraryLoad: () => void;
}
