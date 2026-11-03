// Contact and recruitment channels. Leave a value null until it is confirmed;
// pages hide anything that is null.

export const links = {
  email: 'ucla.bearospace@gmail.com',
  instagram: 'https://www.instagram.com/uclabearospace/',
  linkedin: 'https://www.linkedin.com/company/bearospace-ucla/',
  // Interest form, meeting times, Discord, Linktree: unconfirmed (checklist C6, C7)
  joinForm: null,
  linktree: null,
  discord: null,
  meetings: null,
}

/** Prefilled email subjects for the routed contact buttons. */
export const contactTopics = [
  { id: 'membership', label: 'Membership', subject: 'Joining Bearospace' },
  { id: 'sponsorship', label: 'Sponsorship', subject: 'Sponsorship inquiry — Bearospace' },
  { id: 'general', label: 'General', subject: 'Hello Bearospace' },
]

export function mailto(topicId, extra) {
  const topic = contactTopics.find((t) => t.id === topicId) ?? contactTopics[2]
  const subject = extra ? `${topic.subject} (${extra})` : topic.subject
  return `mailto:${links.email}?subject=${encodeURIComponent(subject)}`
}
