import { generatePageHTML } from './src/components/PublishModalComponents/generator';
import projectDefaults from './src/data/projectDefaults.json';

const html = generatePageHTML(projectDefaults as any, 'home', false);
const footerMatch = html.match(/<section id="home-footer"[\s\S]*?<\/section>/);
console.log(footerMatch ? footerMatch[0] : 'No footer found');
