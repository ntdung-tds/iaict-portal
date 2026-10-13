import sanitizeHtml from "sanitize-html";

const colorPattern = /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%a-z]+\)|[a-z]+)$/i;

export function sanitizePublicationHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [
      "p", "h2", "h3", "h4", "blockquote", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "a", "br", "span", "div", "pre", "code", "hr", "font",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    ],
    allowedAttributes: {
      "*": ["style"],
      a: ["href", "target", "rel", "title"],
      font: ["face", "size", "color"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      "*": {
        "font-family": [/^[a-z0-9\s,"'._-]+$/i],
        "font-size": [/^(?:xx-small|x-small|small|medium|large|x-large|xx-large|\d+(?:\.\d+)?(?:px|pt|em|rem|%))$/i],
        "font-weight": [/^(?:normal|bold|bolder|lighter|[1-9]00)$/i],
        "font-style": [/^(?:normal|italic|oblique)$/i],
        "text-decoration": [/^(?:none|underline|line-through|underline line-through|line-through underline)$/i],
        "text-align": [/^(?:left|center|right|justify|start|end)$/i],
        color: [colorPattern],
        "background-color": [colorPattern],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
    disallowedTagsMode: "discard",
  });
}

export function publicationHtmlToPlainText(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
