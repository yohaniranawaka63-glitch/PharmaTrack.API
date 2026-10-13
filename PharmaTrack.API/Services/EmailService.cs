
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace PharmaTrack.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(
            string toEmail,
            string subject,
            string body)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");

            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var appPassword = emailSettings["AppPassword"];

           
if (string.IsNullOrWhiteSpace(smtpServer) ||
    string.IsNullOrWhiteSpace(senderEmail) ||
    string.IsNullOrWhiteSpace(appPassword))
{
    throw new InvalidOperationException(
        "Email settings are missing.");
}


            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("PharmaTrack", senderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart("plain")
            {
                Text = body
            };

            using var client = new SmtpClient();

            await client.ConnectAsync(
                smtpServer,
                smtpPort,
                SecureSocketOptions.StartTls);

            await client.AuthenticateAsync(senderEmail, appPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
