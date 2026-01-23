export type EmailTemplateKey =
  | "USER_INVITE"
  | "STAFF_NEW_REQUEST"
  | "ASSIGNEE_ASSIGNED"
  | "TENANT_ASSIGNED"
  | "TENANT_CREATED"
  | "TENANT_STATUS_UPDATE";

interface EmailContent {
  subject: string | ((data: any) => string);
  html: (data: any) => string;
}

const layout = (content: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
    <div style="padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      ${content}
    </div>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated message from your Maintenance Portal.
    </p>
  </div>
`;

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailContent> = {
  USER_INVITE: {
    subject: "You've been invited to join",
    html: (data) =>
      layout(`
			<h1>You've been invited!</h1>
			<p>You've been invited to join <strong>${data.orgName}</strong> as a <strong>${data.role.replace("_", " ")}</strong>.</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${data.acceptLink}" 
					style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
					Accept Invitation
				</a>
			</div>
			<p style="color: #666; font-size: 14px;">
				Or copy and paste this link: <br/>
				<span style="color: #0070f3;">${data.acceptLink}</span>
			</p>
			<p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
				This invitation expires in 7 days.
			</p>
		`),
  },
  STAFF_NEW_REQUEST: {
    subject: (data) => `New Maintenance Request: ${data.requestCode}`,
    html: (data) =>
      layout(`
      <h2 style="color: #0070f3;">New Maintenance Request</h2>
      <p>Hi ${data.staffName},</p>
      <p>A new request has been submitted for <strong>${data.propertyName}</strong>.</p>
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #0070f3; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Unit:</strong> ${data.unitNumber || "N/A"}</p>
        <p style="margin: 5px 0;"><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
        <p style="margin: 5px 0;"><strong>Issue:</strong> ${data.description}</p>
      </div>
      <p><a href="${data.link}" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">View Request Details</a></p>
    `),
  },
  TENANT_CREATED: {
    subject: (data) => `Request Received: ${data.requestCode}`,
    html: (data) =>
      layout(`
      <h2>Maintenance Request Received</h2>
      <p>Hi ${data.tenantName},</p>
      <p>We've received your maintenance request for unit <strong>${data.unitNumber || "N/A"}</strong>.</p>
      <p><strong>Status:</strong> Pending Assignment</p>
      <p>You can track updates using your request code: <strong>${data.requestCode}</strong></p>
      <p>Our team will review the request and assign a technician shortly.</p>
    `),
  },
  ASSIGNEE_ASSIGNED: {
    subject: (data) => `New Assignment: ${data.requestCode}`,
    html: (data) =>
      layout(`
      <h2 style="color: #059669;">New Work Order Assigned</h2>
      <p>Hi ${data.assigneeName},</p>
      <p>You have been assigned to maintenance request <strong>${data.requestCode}</strong> at ${data.propertyName}.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        <p><strong>Unit:</strong> ${data.unitNumber || "N/A"}</p>
        <p><strong>Description:</strong> ${data.description}</p>
      </div>
      <p><a href="${data.link}" style="display: inline-block; padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 5px;">Access Work Order</a></p>
    `),
  },
  TENANT_ASSIGNED: {
    subject: (data) => `Technician Assigned: ${data.requestCode}`,
    html: (data) =>
      layout(`
      <h2>Technician Assigned</h2>
      <p>Hi ${data.tenantName},</p>
      <p><strong>${data.staffName}</strong> has been assigned to handle your request: "${data.description}".</p>
      <p>They will contact you shortly if they need to coordinate entry into your unit.</p>
    `),
  },
  TENANT_STATUS_UPDATE: {
    subject: (data) =>
      `Update: Request #${data.requestCode} is now ${data.status.replace("_", " ")}`,
    html: (data) => {
      // Dynamic styling based on status
      const statusColors: Record<string, string> = {
        completed: "#059669", // Green
        cancelled: "#dc2626", // Red
        in_progress: "#0070f3", // Blue
      };
      const color = statusColors[data.status] || "#333";

      return layout(`
        <h2>Maintenance Update</h2>
        <p>Hi ${data.tenantName},</p>
        <p>The status of your maintenance request (<strong>${data.description}</strong>) has been updated to:</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; border-top: 4px solid ${color};">
          <span style="font-size: 1.2rem; font-weight: bold; color: ${color}; text-transform: uppercase;">
            ${data.status.replace("_", " ")}
          </span>
        </div>
        ${data.status === "completed" ? "<p><strong>Note:</strong> We hope the issue was resolved to your satisfaction!</p>" : ""}
        ${data.status === "cancelled" ? "<p>This request has been closed without further action.</p>" : ""}
        <p><a href="${data.link}" style="color: #0070f3; text-decoration: underline;">View full request history</a></p>
      `);
    },
  },
};
