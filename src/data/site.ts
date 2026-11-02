export const site = {
  name: "Andreas Christofi",
  origin: "https://andreaschristofi.com",
  email: "hello@andreaschristofi.com",
  // About introduction (Figma 5734:4599), also the default meta description.
  description: 'I’m an independent Product & UX Designer that builds AI-powered SaaS products & brand-led web experiences.',
  heroDescription: 'I’m Andreas, an independent Product & UX Designer that builds AI-powered SaaS products & brand-led web experiences.',
  cv: "/assets/documents/andreas-christofi-cv.pdf",
};
export const navigation = [
  { label: 'Works', href: '/#curated-shots' },
  { label: 'Process', href: '/#process' },
  { label: 'About', href: '/#about' },
];
// Destinations taken from the approved Figma prototype interactions.
export const socialLinks = [
  { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/andreaschristofi/' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/andrew_ch86/' },
  { label: 'Dribbble', icon: 'dribbble', href: 'https://dribbble.com/_christofi' },
];
export const toolGroups = [
  { label: 'Design', tools: [
    ['Figma','figma'], ['Adobe Photoshop','ps'], ['Adobe Illustrator','ai'],
    ['Adobe After Effects','ae'], ['Adobe InDesign','id'], ['Adobe XD','xd'],
  ] },
  { label: 'Research & Prototyping', tools: [
    ['Claude','research-claude'], ['ChatGPT','chatgpt'], ['Miro','miro'],
  ] },
  { label: 'Development', tools: [
    ['Claude','claude'], ['Codex','codex'], ['Webflow','webflow'],
    ['Visual Studio Code','vscode'], ['HTML5','html5'], ['CSS3','css3'],
    ['JavaScript','js'], ['Astro','astro'], ['GitHub','github'], ['Payload CMS','payload'],
    ['Cloudflare','cloudflare'], ['WordPress','wp'], ['Elementor','elementor'],
    ['WooCommerce','woocommerce'],
  ] },
];
export const awards = [
  { title:'UI, UX & Innovation Awards for Field No.7', detail:'CSS design awards', year:'2023', icon:'css-design' },
  { title:'Jury Member', detail:'Cyprus mobile excellent awards', year:'2020', icon:'cyprus-mobile-excellence' },
  { title:'Honorable Mention for Equfin.com', detail:'Awwwards', year:'2019', icon:'awwwards' },
  { title:'UI, UX, Innovation & Special Kudos Awards for Equfin.com', detail:'CSS design awards', year:'2019', icon:'css-design' },
  { title:'Bronze Award for Best Corporate Website', detail:'Cyprus digital marketing awards', year:'2019', icon:'cyprus-digital-marketing' },
];
/** Figma clients_section (5749:4336), in design order. width/height are the logo's Figma size inside its 120px box. */
export const clients = [
  { name:'Stoli', slug:'stoli', width:100, height:100 },
  { name:'Field No.7', slug:'fieldno7', width:100, height:100 },
  { name:'Hellenic Bank', slug:'hellenic', width:110, height:110 },
  { name:'JCC Payment Systems', slug:'jcc', width:100, height:100 },
  { name:'Four Seasons Hotel', slug:'four-seasons', width:100, height:100 },
  { name:'Muskita Hotels', slug:'muskita', width:51, height:64 },
  { name:'Prevention at Sea', slug:'pas', width:100, height:100 },
  { name:'The Cyprus Institute', slug:'cy-institute', width:110, height:110 },
  { name:'ADSS', slug:'ads-securities', width:100, height:100 },
  { name:'Aristo Developers', slug:'aristo', width:100, height:100 },
  { name:'Axios', slug:'axios', width:110, height:110 },
  { name:'everfx', slug:'everfx', width:100, height:100 },
  { name:'Pandoteira', slug:'pandoteira', width:120, height:120 },
];
