import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mount = vi.hoisted(() => ({ createRoot: vi.fn(), render: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: mount.createRoot }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mount.createRoot.mockReturnValue({ render: mount.render });
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

it('should_mount_react_when_the_html_root_exists', async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  await import('./main');
  expect(mount.createRoot).toHaveBeenCalledWith(root);
  expect(mount.render).toHaveBeenCalledOnce();
});

it('should_fail_explicitly_when_the_html_root_is_missing', async () => {
  await expect(import('./main')).rejects.toThrow(
    'Point de montage React introuvable.',
  );
  expect(mount.createRoot).not.toHaveBeenCalled();
});
