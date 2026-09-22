<?php

namespace App\Mail;

use App\Models\ParishRegistration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ParishRegistrationWelcome extends Mailable
{
    use Queueable;
    use SerializesModels;

    public ParishRegistration $registration;

    /**
     * Create a new message instance.
     */
    public function __construct(ParishRegistration $registration)
    {
        $this->registration = $registration;
    }

    /**
     * Build the email.
     */
    public function build()
    {
        return $this->subject('Welcome to St Mary\'s Cathedral Parish - '.$this->registration->member_id)
            ->view('emails.parish-registration-welcome');
    }
}
