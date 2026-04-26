const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAssignmentEmail({ volunteer, problem, workspace }) {
  const skillsList = Array.isArray(volunteer.skills)
    ? volunteer.skills.join(', ')
    : volunteer.skills || 'N/A';

  const priorityColors = {
    Low: '#6B7280',
    Medium: '#F59E0B',
    High: '#F97316',
    Critical: '#EF4444',
  };

  const priorityColor = priorityColors[problem.priority] || '#6B7280';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Assignment Notification</title>
      </head>
      <body style="margin:0; padding:0; background:#f3f4f6; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff; border-radius:12px; overflow:hidden;
                       box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #065f46 100%);
                              padding: 32px 40px; text-align: center;">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;
                               letter-spacing: 0.5px;">
                      🚨 New Problem Assignment
                    </h1>
                    <p style="margin: 8px 0 0; color:#a7f3d0; font-size:14px;">
                      Smart Resource Allocation System
                    </p>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <p style="margin:0; font-size:16px; color:#111827;">
                      Hello <strong>${volunteer.full_name}</strong>,
                    </p>
                    <p style="margin: 12px 0 0; font-size:15px; color:#374151; line-height:1.6;">
                      You have been assigned a new problem by
                      <strong>${workspace.ngo_name}</strong>. Please review the
                      details below and take action as soon as possible.
                    </p>
                  </td>
                </tr>

                <!-- Priority Badge -->
                <tr>
                  <td style="padding: 24px 40px 0;">
                    <span style="display:inline-block; background:${priorityColor};
                                 color:#ffffff; font-size:13px; font-weight:700;
                                 padding: 4px 14px; border-radius:999px;
                                 letter-spacing:0.5px;">
                      ${problem.priority.toUpperCase()} PRIORITY
                    </span>
                  </td>
                </tr>

                <!-- Problem Details Card -->
                <tr>
                  <td style="padding: 16px 40px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f8fafc; border:1px solid #e2e8f0;
                             border-radius:10px; overflow:hidden;">
                      <tr>
                        <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
                                   background:#f1f5f9;">
                          <p style="margin:0; font-size:11px; font-weight:700;
                                    color:#64748b; letter-spacing:1px;
                                    text-transform:uppercase;">
                            Problem Details
                          </p>
                        </td>
                      </tr>

                      <!-- Row -->
                      <tr>
                        <td style="padding: 14px 24px; border-bottom:1px solid #f1f5f9;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                📋 Title
                              </td>
                              <td style="color:#111827; font-size:14px; font-weight:600;">
                                ${problem.title}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px; border-bottom:1px solid #f1f5f9;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                🏷️ Category
                              </td>
                              <td style="color:#111827; font-size:14px;">
                                ${problem.category}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px; border-bottom:1px solid #f1f5f9;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                📍 Location
                              </td>
                              <td style="color:#111827; font-size:14px;">
                                ${problem.landmark ? `${problem.landmark}, ` : ''}${problem.city}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px; border-bottom:1px solid #f1f5f9;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                📏 Distance
                              </td>
                              <td style="color:#059669; font-size:14px; font-weight:600;">
                                ${volunteer.distanceKm} km from you
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px; border-bottom:1px solid #f1f5f9;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                👥 People Affected
                              </td>
                              <td style="color:#111827; font-size:14px;">
                                ${problem.estimated_people_affected ?? 'Not specified'}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="40%" style="color:#64748b; font-size:13px;">
                                📞 Contact Person
                              </td>
                              <td style="color:#111827; font-size:14px;">
                                ${problem.contact_person_name ?? 'N/A'}
                                ${problem.contact_person_phone
                                  ? ` — ${problem.contact_person_phone}`
                                  : ''}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Description -->
                ${problem.description ? `
                <tr>
                  <td style="padding: 20px 40px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fefce8; border-left: 4px solid #F59E0B;
                             border-radius: 0 8px 8px 0; padding: 0;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin:0 0 6px; font-size:12px; font-weight:700;
                                    color:#92400e; text-transform:uppercase;
                                    letter-spacing:0.5px;">
                            Description
                          </p>
                          <p style="margin:0; font-size:14px; color:#78350f;
                                    line-height:1.6;">
                            ${problem.description}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}

                <!-- Volunteer Info -->
                <tr>
                  <td style="padding: 20px 40px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f0fdf4; border:1px solid #bbf7d0;
                             border-radius:10px;">
                      <tr>
                        <td style="padding: 16px 24px; border-bottom:1px solid #bbf7d0;
                                   background:#dcfce7; border-radius:10px 10px 0 0;">
                          <p style="margin:0; font-size:11px; font-weight:700;
                                    color:#166534; letter-spacing:1px;
                                    text-transform:uppercase;">
                            Your Assignment Info
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 24px;">
                          <p style="margin:0; font-size:14px; color:#166534;">
                            🛠️ <strong>Your Skills:</strong> ${skillsList}
                          </p>
                          <p style="margin:8px 0 0; font-size:14px; color:#166534;">
                            🏢 <strong>NGO:</strong> ${workspace.ngo_name}
                          </p>
                          <p style="margin:8px 0 0; font-size:14px; color:#166534;">
                            📧 <strong>NGO Contact:</strong> ${workspace.contact_email}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 28px 40px 0; text-align:center;">
                    <p style="margin:0; font-size:15px; color:#374151;">
                      Please respond to this assignment immediately and coordinate
                      with the NGO contact listed above.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; text-align:center;
                             border-top: 1px solid #e5e7eb; margin-top: 24px;">
                    <p style="margin:0; font-size:12px; color:#9ca3af;">
                      This is an automated message from
                      <strong>Smart Resource Allocation System</strong>.
                      <br />Please do not reply to this email.
                    </p>
                    <p style="margin: 8px 0 0; font-size:12px; color:#d1d5db;">
                      © ${new Date().getFullYear()} Smart Resource Allocation System
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: volunteer.email,
    subject: `🚨 [${problem.priority} Priority] New Assignment: ${problem.title}`,
    html,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error('Failed to send assignment email');
  }

  return data;
}

module.exports = {sendAssignmentEmail}