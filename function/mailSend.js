const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.APIKEY);
let appLogo = "";
// let appLogo = "https://ronlawrencebucket.s3.us-east-1.amazonaws.com/logo.png";

const registerMail = (data) => {
	// console.log(process.env.APIKEY, process.env.SENDER)
    var mailOptions = {
        from: `Drafta.fun <${process.env.SENDER}>`, //process.env.SENDER,
        to: data.to,
        subject: "Verify Your Email on Draft.fun",
        html: `<body style="background-color:#eeeeee; padding:0; margin:0;">
	<table id="m_2717022745648039245m_-4740547828852282236mailerPage" width="100%" cellpadding="0" cellspacing="0" border="0"
		style="border-collapse:collapse;line-height:24px;width:100%;font-size:14px;color:#1c1c1e;background-color:#fff;margin:0;padding:0"
		bgcolor="#fff">
		<tbody>
			<tr>
				<td valign="top" style="font-family:Arial;border-collapse:collapse">
					<table cellpadding="0" cellspacing="0" border="0" align="center"
						style="border-collapse:collapse;background-color:#fff;border-radius:4px;margin-top:0;margin-bottom:0;"
						bgcolor="#fff">
						<tbody>
							<tr>
								<td width="600" valign="top" style="background-image: url(https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/Mobile.png);background-size: 100%;height: 310px;padding-left: 24px;vertical-align: middle;">
									<img src="https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/logo.png" width="120"/>
									<h1 style="color: #fff;font-size: 35px;max-width: 300px;line-height: 1.3;">Verify your Account</h1>
								</td>
							</tr>							
							<tr>
								<td width="600" valign="top">
									<div style="background-color: #f5f5f5;padding: 24px 42px 50px;">
										<table cellpadding="0" cellspacing="0" border="0"
											style="border-collapse:collapse;">
											<tbody>
												<tr>
													<td width="600" valign="top">
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															Hey ${data.user}, </p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															To ensure your account and details are secure, please verify your login by entering the OTP below:</p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<h3
															style="margin: 0px;padding: 8px 0;color: #8002FF;font-size: 24px;font-weight: 600;">
															Your OTP : ${data.otp}</h3>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															Please note that this OTP is valid for the next 3 minutes.
															if you don't verify within this time, you'll need to request
															a new OTP.</p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															If you didn't initiate this process, please disregard this email.
														</p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															© Draft.Fun, All Rights Reserved</p>
													</td>
												</tr>
												<tr>
													<td width="600" valign="top" style="padding: 32px 0">
													</td>
												</tr>												
											</tbody>
										</table>

									</div>
								</td>
							</tr>
							<tr>
								<td style="background-color: #8002FF;padding: 24px;text-align: center;">
									<img src="https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/logo.png" width="120" style="margin: 0 0 15px;"/>
									<p style="margin: 0 0 10px;padding: 0 0;color: #fff;font-size: 14px;font-weight: 400;text-align: center;">
									© 2023 Draft. All rights reserved </p>
									<ul style="display: flex;justify-content: center;list-style: none;padding: 0;margin: 0;">
										<li><a href="http://52.70.9.224/terms-condition" target="_blank" style="color: #fff;text-decoration: none;">Privacy Policy</a></li>
										<li style="color: #fff;">&nbsp; | &nbsp;</li>
										<li><a href="http://52.70.9.224/privacy-policy" target="_blank" style="color: #fff;text-decoration: none;">Privacy Policy</a></li>
										<li style="color: #fff;">&nbsp; | &nbsp;</li>
										<li><a href="http://52.70.9.224/faq" target="_blank" style="color: #fff;text-decoration: none;">Faq</a></li>
									</ul>
								</td>
							</tr>
						</tbody>
					</table>

				</td>

			</tr>
		</tbody>
	</table>

</body>`
    };
    sgMail
        .send(mailOptions)
        .then(() => {
            console.log("Email sent");
        })
        .catch((error) => {
            console.log(error.response.body);
        });
};

const sendInviteMail = (data) => {
    var mailOptions = {
        from: `Drafta.fun <${process.env.SENDER}>`, //process.env.SENDER,
        to: data.to,
        subject: "Simplest Fantasy Game Ever!",
        html: `<body style="background-color:#eeeeee; padding:0; margin:0;">
	<table id="m_2717022745648039245m_-4740547828852282236mailerPage" width="100%" cellpadding="0" cellspacing="0" border="0"
		style="border-collapse:collapse;line-height:24px;width:100%;font-size:14px;color:#1c1c1e;background-color:#fff;margin:0;padding:0"
		bgcolor="#fff">
		<tbody>
			<tr>
				<td valign="top" style="font-family:Arial;border-collapse:collapse">
					<table cellpadding="0" cellspacing="0" border="0" align="center"
						style="border-collapse:collapse;background-color:#fff;border-radius:4px;margin-top:0;margin-bottom:0;"
						bgcolor="#fff">
						<tbody>
							<tr>
								<td width="600" valign="top" style="background-image: url(https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/Mobile.png);background-size: 100%;height: 310px;padding-left: 24px;vertical-align: middle;">
									<img src="https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/logo.png" width="120"/>
									<h1 style="color: #fff;font-size: 35px;max-width: 300px;line-height: 1.3;">Verify your Account</h1>
								</td>
							</tr>							
							<tr>
								<td width="600" valign="top">
									<div style="background-color: #f5f5f5;padding: 24px 42px 50px;">
										<table cellpadding="0" cellspacing="0" border="0"
											style="border-collapse:collapse;">
											<tbody>
												<tr>
													<td width="600" valign="top">
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															Hey ${data.user}, </p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															Check out Draft.fun - Daily Fantasy Made Easy. Use my registration code to signup!</p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															Registration Code: ${data.code}</p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
																												<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															<a href="http://52.70.9.224/">Click here to sign up!</a></p>
														<p
															style="margin: 0px;padding: 8px 0;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
														</p>
														<p
															style="margin: 0px;padding: 0px;color: #000;font-size: 16px;line-height: 25px;font-weight: 400;">
															© Draft.Fun, All Rights Reserved</p>
													</td>
												</tr>
												<tr>
													<td width="600" valign="top" style="padding: 32px 0">
													</td>
												</tr>												
											</tbody>
										</table>

									</div>
								</td>
							</tr>
							<tr>
								<td style="background-color: #8002FF;padding: 24px;text-align: center;">
									<img src="https://fantasy-sports-dev.s3.us-east-1.amazonaws.com/public/mailicons/logo.png" width="120" style="margin: 0 0 15px;"/>
									<p style="margin: 0 0 10px;padding: 0 0;color: #fff;font-size: 14px;font-weight: 400;text-align: center;">
									© 2023 Draft. All rights reserved </p>
									<ul style="display: flex;justify-content: center;list-style: none;padding: 0;margin: 0;">
										<li><a href="http://52.70.9.224/terms-condition" target="_blank" style="color: #fff;text-decoration: none;">Privacy Policy</a></li>
										<li style="color: #fff;">&nbsp; | &nbsp;</li>
										<li><a href="http://52.70.9.224/privacy-policy" target="_blank" style="color: #fff;text-decoration: none;">Privacy Policy</a></li>
										<li style="color: #fff;">&nbsp; | &nbsp;</li>
										<li><a href="http://52.70.9.224/faq" target="_blank" style="color: #fff;text-decoration: none;">Faq</a></li>
									</ul>
								</td>
							</tr>
						</tbody>
					</table>

				</td>

			</tr>
		</tbody>
	</table>

</body>`
    };
    sgMail
        .send(mailOptions)
        .then(() => {
            console.log("Email sent");
        })
        .catch((error) => {
            console.log(error.response.body);
        });
};

module.exports = {
    registerMail,
    sendInviteMail
};
