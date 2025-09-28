<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Email extends BaseConfig
{
    public string $fromEmail  = '';
    public string $fromName   = '';
    public string $recipients = '';

    /**
     * The "user agent"
     */
    public string $userAgent = 'CodeIgniter';

    /**
     * The mail sending protocol: mail, sendmail, smtp
     */
    public string $protocol = 'mail';

    /**
     * The server path to Sendmail.
     */
    public string $mailPath = '/usr/sbin/sendmail';

    /**
     * SMTP Server Hostname
     */
    public string $SMTPHost = '';

    /**
     * SMTP Username
     */
    public string $SMTPUser = '';

    /**
     * SMTP Password
     */
    public string $SMTPPass = '';

    /**
     * SMTP Port
     */
    public int $SMTPPort = 25;

    /**
     * SMTP Timeout (in seconds)
     */
    public int $SMTPTimeout = 5;

    /**
     * Enable persistent SMTP connections
     */
    public bool $SMTPKeepAlive = false;

    /**
     * SMTP Encryption.
     *
     * @var string '', 'tls' or 'ssl'. 'tls' will issue a STARTTLS command
     *             to the server. 'ssl' means implicit SSL. Connection on port
     *             465 should set this to ''.
     */
    public string $SMTPCrypto = 'tls';

    /**
     * Enable word-wrap
     */
    public bool $wordWrap = true;

    /**
     * Character count to wrap at
     */
    public int $wrapChars = 76;

    /**
     * Type of mail, either 'text' or 'html'
     */
    public string $mailType = 'text';

    /**
     * Character set (utf-8, iso-8859-1, etc.)
     */
    public string $charset = 'UTF-8';

    /**
     * Whether to validate the email address
     */
    public bool $validate = false;

    /**
     * Email Priority. 1 = highest. 5 = lowest. 3 = normal
     */
    public int $priority = 3;

    /**
     * Newline character. (Use “\r\n” to comply with RFC 822)
     */
    public string $CRLF = "\r\n";

    /**
     * Newline character. (Use “\r\n” to comply with RFC 822)
     */
    public string $newline = "\r\n";

    /**
     * Enable BCC Batch Mode.
     */
    public bool $BCCBatchMode = false;

    /**
     * Number of emails in each BCC batch
     */
    public int $BCCBatchSize = 200;

    /**
     * Enable notify message from server
     */
    public bool $DSN = false;

    public function __construct()
    {
        $this->fromEmail     = env('email.fromEmail', $this->fromEmail);
        $this->fromName      = env('email.fromName', $this->fromName);
        $this->recipients    = env('email.recipients', $this->recipients);

        $this->userAgent     = env('email.userAgent', $this->userAgent);
        $this->protocol      = env('email.protocol', $this->protocol);
        $this->mailPath      = env('email.mailPath', $this->mailPath);

        $this->SMTPHost      = env('email.SMTPHost', $this->SMTPHost);
        $this->SMTPUser      = env('email.SMTPUser', $this->SMTPUser);
        $this->SMTPPass      = env('email.SMTPPass', $this->SMTPPass);
        $this->SMTPPort      = (int) env('email.SMTPPort', $this->SMTPPort);
        $this->SMTPTimeout   = (int) env('email.SMTPTimeout', $this->SMTPTimeout);
        $this->SMTPKeepAlive = (bool) env('email.SMTPKeepAlive', $this->SMTPKeepAlive);
        $this->SMTPCrypto    = env('email.SMTPCrypto', $this->SMTPCrypto);

        $this->wordWrap      = (bool) env('email.wordWrap', $this->wordWrap);
        $this->wrapChars     = (int) env('email.wrapChars', $this->wrapChars);
        $this->mailType      = env('email.mailType', $this->mailType);
        $this->charset       = env('email.charset', $this->charset);
        $this->validate      = (bool) env('email.validate', $this->validate);
        $this->priority      = (int) env('email.priority', $this->priority);
        $this->CRLF          = env('email.CRLF', $this->CRLF);
        $this->newline       = env('email.newline', $this->newline);
        $this->BCCBatchMode  = (bool) env('email.BCCBatchMode', $this->BCCBatchMode);
        $this->BCCBatchSize  = (int) env('email.BCCBatchSize', $this->BCCBatchSize);
        $this->DSN           = (bool) env('email.DSN', $this->DSN);
    }
}
