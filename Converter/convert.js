#!/usr/bin/env node
/**
 * Convert John_Marzulli.md to John_Marzulli.html
 * Usage: node convert.js
 * or:    npm run build
 */

const fs = require('fs');
const path = require('path');

const md = fs.readFileSync('../John_Marzulli.md', 'utf-8');
const template = fs.readFileSync('./resume-template.html', 'utf-8');

// Escape HTML
const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Split into lines for easier parsing
const lines = md.split('\n');
let idx = 0;

// Skip empty lines
const skipEmpty = () => {
  while (idx < lines.length && !lines[idx].trim()) idx++;
};

// Read until heading at level (default 2)
const readUntil = (headingLevel = 2) => {
  const content = [];
  const marker = '#'.repeat(headingLevel);
  while (idx < lines.length && !lines[idx].match(new RegExp(`^${marker}(?!#)`))) {
    content.push(lines[idx]);
    idx++;
  }
  return content.join('\n').trim();
};

// Parse header section
skipEmpty();
const nameMatch = lines[idx].match(/^# (.+)/);
const name = nameMatch ? nameMatch[1] : '';
idx++;

skipEmpty();
let role = '', location = '', contacts = [];
while (idx < lines.length && !lines[idx].match(/^## /)) {
  const line = lines[idx].trim();

  if (line.match(/^\*\*/) && !role) {
    role = line.replace(/\*\*/g, '');
  } else if (line.match(/^Seattle/) && !location) {
    location = line;
  } else if (line.includes('](')) {
    const email = line.match(/\[([^\]]+)\]\(mailto:([^\)]+)\)/);
    if (email) contacts.push(`<a href="mailto:${esc(email[2])}">${esc(email[1])}</a>`);

    const linkedin = line.match(/\[LinkedIn\]\(([^\)]+)\)/);
    if (linkedin) contacts.push(`<a href="${esc(linkedin[1])}">linkedin.com/in/johnmarzulli</a>`);

    const github = line.match(/\[GitHub\]\(([^\)]+)\)/);
    if (github) contacts.push(`<a href="${esc(github[1])}">github.com/JohnMarzulli</a>`);
  }
  idx++;
}

// Parse sections
const parseSection = (heading) => {
  const marker = `## ${heading}`;
  const sectionIdx = lines.findIndex((l, i) => i >= idx && l.match(new RegExp(`^${marker}$`)));
  if (sectionIdx === -1) return '';

  const start = sectionIdx + 1;
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].match(/^## /)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
};

// Skills
const skills = parseSection('Top Skills')
  .split('\n')
  .filter(l => l.match(/^- /))
  .map(l => `<li>${esc(l.replace(/^- /, ''))}</li>`)
  .join('\n          ');

// Technologies
const techs = parseSection('Core Technologies')
  .split('\n')
  .filter(l => l.match(/^- /))
  .map(l => `<span class="chip">${esc(l.replace(/^- /, ''))}</span>`)
  .join('\n          ');

// Summary
const summaryHtml = parseSection('Summary')
  .split('\n')
  .filter(l => l.trim() && !l.match(/^#/))
  .map(p => `<p>${esc(p)}</p>`)
  .join('\n        ');

// Education
const eduSection = parseSection('Education');
const eduParts = eduSection.split('\n').filter(l => l.trim());
let eduHtml = '';
if (eduParts.length >= 3) {
  const school = eduParts[0].replace(/^### /, '');
  const degree = eduParts[1].replace(/\*\*/g, '');
  const years = eduParts[2].replace(/[_*]/g, '');
  eduHtml = `<div class="edu-school">${esc(school)}</div>
        <div class="edu-degree">${esc(degree)}</div>
        <div class="edu-years">${esc(years)}</div>`;
}

// Professional Experience (complex nested structure)
const expSection = parseSection('Professional Experience');
const expLines = expSection.split('\n');
let expHtml = '';
let i = 0;

while (i < expLines.length) {
  const line = expLines[i];

  if (line.match(/^### /)) {
    const company = line.replace(/^### /, '');
    expHtml += `          <div class="company-group">\n`;
    expHtml += `            <h3 class="company-name">${esc(company)}</h3>\n`;
    i++;

    // Roles within company
    while (i < expLines.length && !expLines[i].match(/^### /)) {
      const roleLine = expLines[i];

      if (roleLine.match(/^#### /)) {
        const title = roleLine.replace(/^#### /, '');
        expHtml += `            <div class="role">\n`;
        expHtml += `              <div class="role-header">\n`;
        expHtml += `                <span class="role-title">${esc(title)}</span>\n`;
        i++;

        // Skip blank lines and find date line
        while (i < expLines.length && !expLines[i].trim()) i++;
        if (i < expLines.length && expLines[i].match(/^\*/)) {
          const dates = expLines[i].replace(/^\*|\*$/g, '').trim();
          expHtml += `                <span class="role-when}">${esc(dates)}</span>\n`;
          i++;
        }
        expHtml += `              </div>\n`;

        // Bullets and themes
        const groups = [];
        let currentTheme = null;
        let bullets = [];

        while (i < expLines.length && !expLines[i].match(/^#### /) && !expLines[i].match(/^### /)) {
          const l = expLines[i];

          if (l.match(/^##### /)) {
            if (bullets.length > 0) {
              groups.push({ theme: currentTheme, bullets });
              bullets = [];
            }
            currentTheme = l.replace(/^##### /, '');
            i++;
            continue;
          }

          if (l.match(/^- /)) {
            bullets.push(l.replace(/^- /, ''));
          }
          i++;
        }

        if (bullets.length > 0) {
          groups.push({ theme: currentTheme, bullets });
        }

        // Render groups
        if (groups.length === 1 && !groups[0].theme) {
          expHtml += `              <ul class="bullets">\n`;
          groups[0].bullets.forEach(b => {
            expHtml += `                <li>${esc(b)}</li>\n`;
          });
          expHtml += `              </ul>\n`;
        } else {
          groups.forEach(g => {
            if (g.theme) {
              expHtml += `              <p class="theme-label">${esc(g.theme)}</p>\n`;
            }
            expHtml += `              <ul class="bullets">\n`;
            g.bullets.forEach(b => {
              expHtml += `                <li>${esc(b)}</li>\n`;
            });
            expHtml += `              </ul>\n`;
          });
        }

        expHtml += `            </div>\n`;
      } else {
        i++;
      }
    }
    expHtml += `        </div>\n`;
  } else {
    i++;
  }
}

// Open Source Projects
const projectsSection = parseSection('Current Open Source Projects');
const projectLines = projectsSection.split('\n');
let projectsHtml = '';
let j = 0;

while (j < projectLines.length) {
  const line = projectLines[j];

  if (line.match(/^### /)) {
    const projectName = line.replace(/^### /, '');
    projectsHtml += `          <div class="project">\n`;
    projectsHtml += `            <h3 class="project-name">${esc(projectName)}</h3>\n`;
    j++;

    // Collect description lines, tech, and link until next project
    const descriptions = [];
    let tech = '';
    let link = '';

    while (j < projectLines.length && !projectLines[j].match(/^### /)) {
      const l = projectLines[j];

      // Tech stack line (in parentheses)
      if (l.match(/^\(/)) {
        tech = l.replace(/^\(|\)$/g, '').trim();
        j++;
        continue;
      }

      // Link line
      if (l.match(/^<http/)) {
        link = l.replace(/^<|>$/g, '').trim();
        j++;
        continue;
      }

      // Description lines (non-empty, not special)
      if (l.trim() && !l.match(/^#/)) {
        descriptions.push(l.trim());
      }

      j++;
    }

    // Render project
    if (descriptions.length > 0) {
      projectsHtml += `            <p class="project-desc">${esc(descriptions.join(' '))}</p>\n`;
    }
    if (tech) {
      projectsHtml += `            <p class="project-tech">${esc(tech)}</p>\n`;
    }
    if (link) {
      projectsHtml += `            <p class="project-link"><a href="${esc(link)}">${esc(link)}</a></p>\n`;
    }
    projectsHtml += `          </div>\n`;
  } else {
    j++;
  }
}

// Fill template
const html = template
  .replace('<!-- NAME -->', esc(name))
  .replace('<!-- ROLE -->', esc(role))
  .replace('<!-- LOCATION -->', esc(location))
  .replace('<!-- CONTACT -->', contacts.join('\n      '))
  .replace('<!-- SKILLS -->', skills)
  .replace('<!-- TECHNOLOGIES -->', techs)
  .replace('<!-- EDUCATION -->', eduHtml)
  .replace('<!-- SUMMARY -->', summaryHtml)
  .replace('<!-- EXPERIENCE -->', expHtml)
  .replace('<!-- PROJECTS -->', projectsHtml);

fs.writeFileSync('../John_Marzulli.html', html);
