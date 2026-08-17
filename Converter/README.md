# Resume

Styled HTML résumé with automated Markdown→HTML conversion.

## Files

- **`John_Marzulli.md`** — Source of truth. Edit this when updating your résumé content.
- **`John_Marzulli.html`** — Generated styled HTML. Don't edit directly.
- **`resume-template.html`** — Template with styling. Edit only if changing the design.
- **`convert.js`** — Conversion script that reads Markdown and fills the template.

## Workflow

1. **Edit your content** in `John_Marzulli.md`
2. **Regenerate HTML** by running:
   ```bash
   node convert.js
   ```
   or
   ```bash
   npm run build
   ```
3. **Commit both files** — both `.md` and `.html` stay in git

## Conversion

The `convert.js` script:
- Reads `John_Marzulli.md` 
- Parses the Markdown structure (headers, skills, experience with themes, etc.)
- Fills the `resume-template.html` template with your content
- Writes the styled `John_Marzulli.html`

The conversion is deterministic — same Markdown always produces the same HTML.

## Markdown Format

The script expects this structure:

```markdown
# John Marzulli

**Title / Role**
Location

[email](mailto:...) · [LinkedIn](...) · [GitHub](...)

## Top Skills
- Skill 1
- Skill 2

## Core Technologies
- Tech 1
- Tech 2

## Summary
Paragraph about you.

## Experience

### Company Name

#### Role Title

*Date range – Location*

- Bullet point
- Another point

##### Theme Label (optional)

- Themed bullet
- Another themed bullet

## Education

### School Name

**Degree**
*Years*
```

## Styling

The HTML includes:
- Two-column layout (sidebar + main)
- Dark/light mode support
- Print-friendly CSS
- Timeline visualization for experience
- Responsive design

To modify colors, fonts, or spacing, edit the CSS `<style>` block in `resume-template.html`.
