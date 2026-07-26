import { buildElement } from './blog-thumbnail-render';

export function buildNoteCoverElement(title: string) {
  return buildElement(
    {
      title,
      subtitle: null,
      category: 'NOTE',
      domainPath: 'note.com/stats47',
    },
    false
  );
}
