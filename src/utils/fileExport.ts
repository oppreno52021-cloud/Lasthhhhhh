import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportFileOptions {
  filename: string;
  content: string;
  mimeType?: string;
  dialogTitle?: string;
}

export interface ExportFileResult {
  success: boolean;
  canceled?: boolean;
  uri?: string;
  error?: string;
}

export async function exportFile(options: ExportFileOptions): Promise<ExportFileResult> {
  const { filename, content, mimeType = 'text/plain', dialogTitle = 'Share or Save File' } = options;

  try {
    if (Capacitor.isNativePlatform()) {
      (window as any).__isSystemPickerActive = true;
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: dialogTitle,
        url: writeResult.uri,
        dialogTitle: dialogTitle,
      });

      setTimeout(() => {
        (window as any).__isSystemPickerActive = false;
      }, 1000);

      return { success: true, uri: writeResult.uri };
    }

    // Web fallback using standard Blob download
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err: any) {
    (window as any).__isSystemPickerActive = false;
    if (err?.message?.includes('canceled') || err?.message?.includes('dismissed')) {
      return { success: false, canceled: true };
    }
    console.error('Failed to export file:', err);
    return { success: false, error: err?.message || 'Export failed' };
  }
}
