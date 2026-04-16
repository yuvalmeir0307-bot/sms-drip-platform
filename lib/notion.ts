import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export const NOTION_DB_ID = () => process.env.NOTION_DATABASE_ID!;

export interface NotionLead {
  notionId: string;
  name: string;
  phone: string;
  status: string;
}

export async function getDripActiveLeads(): Promise<NotionLead[]> {
  const response = await notion.databases.query({
    database_id: NOTION_DB_ID(),
    filter: {
      property: 'Status',
      status: { equals: 'Drip Active' },
    },
  });

  return response.results
    .filter((page): page is typeof page & { properties: Record<string, unknown> } => 'properties' in page)
    .map((page) => {
      const props = page.properties as Record<string, { type: string; title?: Array<{ plain_text: string }>; phone_number?: string; rich_text?: Array<{ plain_text: string }>; status?: { name: string } }>;

      const name =
        props['Name']?.title?.[0]?.plain_text ||
        props['Full Name']?.title?.[0]?.plain_text ||
        '';

      const phone =
        props['Phone']?.phone_number ||
        props['Phone Number']?.phone_number ||
        '';

      const status =
        props['Status']?.status?.name || '';

      return { notionId: page.id, name, phone, status };
    })
    .filter((lead) => lead.name && lead.phone);
}

export async function updateLeadStatus(notionId: string, status: string) {
  await notion.pages.update({
    page_id: notionId,
    properties: {
      Status: {
        status: { name: status },
      },
    },
  });
}

export default notion;
