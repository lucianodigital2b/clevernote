<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewUserFeedback extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct() {}

    public function via(object $notifiable): array
    {
        // Only send in production environment
        if (!app()->isProduction()) {
            return [];
        }
        
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Welcome to Clevernote 👋 Got 1 minute?')
            ->markdown('emails.new-user-feedback', [
                'user' => $notifiable,
            ]);
    }
}
