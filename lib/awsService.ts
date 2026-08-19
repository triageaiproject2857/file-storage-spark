import { BackupFile } from '@/components/cloudvault-dashboard'

export const USE_MOCK_AWS = true
const API_BASE_URL = 'https://your-api-gateway-url.execute-api.region.amazonaws.com'
const MOCK_STORAGE_KEY = 'cloudvault_mock_files'
const MOCK_USAGE_KEY = 'cloudvault_mock_usage'

// Initialize mock data if empty
const initializeMockData = () => {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(MOCK_STORAGE_KEY)) {
    const initialFiles: BackupFile[] = [
      { id: '1', name: 'Q4 Financial Report.xlsx', type: 'spreadsheet', size: '2.4 MB', date: 'Today, 10:42 AM', status: 'Completed', s3Key: 'mock-1' },
      { id: '2', name: 'Project Aurora — Assets.zip', type: 'archive', size: '846 MB', date: 'Today, 9:18 AM', status: 'Completed', s3Key: 'mock-2' },
      { id: '3', name: 'Team offsite photos', type: 'image', size: '124 MB', date: 'Yesterday, 4:36 PM', status: 'Completed', s3Key: 'mock-3' },
      { id: '4', name: 'Product roadmap.docx', type: 'document', size: '1.8 MB', date: 'Yesterday, 2:05 PM', status: 'Completed', s3Key: 'mock-4' },
      { id: '5', name: 'Brand guidelines.pdf', type: 'document', size: '8.2 MB', date: 'Feb 18, 2025', status: 'In progress', s3Key: 'mock-5' },
      { id: '6', name: 'Customer exports.csv', type: 'spreadsheet', size: '42.6 MB', date: 'Feb 17, 2025', status: 'Completed', s3Key: 'mock-6' },
    ]
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialFiles))
  }
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getFileType = (fileName: string): BackupFile['type'] => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return 'archive'
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return 'image'
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'spreadsheet'
  return 'document'
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const awsService = {
  fetchFiles: async (): Promise<BackupFile[]> => {
    if (USE_MOCK_AWS) {
      await delay(500)
      initializeMockData()
      const stored = localStorage.getItem(MOCK_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } else {
      const response = await fetch(`${API_BASE_URL}/api/metadata`, { method: 'GET' })
      if (!response.ok) throw new Error('Failed to fetch files')
      const data = await response.json()
      return data.files || []
    }
  },

  uploadFile: async (file: File): Promise<BackupFile> => {
    const newFile: BackupFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: getFileType(file.name),
      size: formatSize(file.size),
      date: 'Just now',
      status: 'Completed',
    }

    if (USE_MOCK_AWS) {
      await delay(1500) // Simulate upload
      const s3Key = URL.createObjectURL(file) // Mock S3 URL
      const fileWithKey = { ...newFile, s3Key }

      const stored = localStorage.getItem(MOCK_STORAGE_KEY)
      const files = stored ? JSON.parse(stored) : []
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([fileWithKey, ...files]))

      return fileWithKey
    } else {
      // 1. Get Presigned URL
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      })
      if (!uploadRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, fileKey } = await uploadRes.json()

      // 2. Upload to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      })
      if (!s3Res.ok) throw new Error('Failed to upload to S3')

      // 3. Save Metadata
      const fileWithKey = { ...newFile, s3Key: fileKey }
      const metaRes = await fetch(`${API_BASE_URL}/api/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileWithKey)
      })
      if (!metaRes.ok) throw new Error('Failed to save metadata')

      return fileWithKey
    }
  },

  deleteFile: async (file: BackupFile): Promise<void> => {
    if (USE_MOCK_AWS) {
      await delay(500)
      const stored = localStorage.getItem(MOCK_STORAGE_KEY)
      if (stored) {
        const files: BackupFile[] = JSON.parse(stored)
        const updatedFiles = files.filter(f => f.id !== file.id)
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updatedFiles))
        if (file.s3Key && file.s3Key.startsWith('blob:')) {
            URL.revokeObjectURL(file.s3Key)
        }
      }
    } else {
      const response = await fetch(`${API_BASE_URL}/api/files/${file.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete file')
import { authService, User } from './authService';

export type BackupFile = {
  id: string;
  name: string;
  type: 'document' | 'image' | 'spreadsheet' | 'archive';
  size: string;
  sizeBytes: number;
  date: string;
  timestamp: number;
  status: 'Completed' | 'In progress' | 'Failed';
  isDeleted: boolean;
};

export type ActionLog = {
  id: string;
  userId: string;
  userName: string;
  action: 'Upload' | 'Delete' | 'Restore' | 'Download';
  fileName: string;
  timestamp: number;
};

const FILES_KEY = 'cloudvault_files';
const LOGS_KEY = 'cloudvault_logs';
const USERS_KEY = 'cloudvault_users'; // for admin panel to fetch users

const initialFiles: BackupFile[] = [
  { id: '1', name: 'Q4 Financial Report.xlsx', type: 'spreadsheet', size: '2.4 MB', sizeBytes: 2516582, date: 'Today, 10:42 AM', timestamp: Date.now() - 1000 * 60 * 120, status: 'Completed', isDeleted: false },
  { id: '2', name: 'Project Aurora — Assets.zip', type: 'archive', size: '846 MB', sizeBytes: 887140352, date: 'Today, 9:18 AM', timestamp: Date.now() - 1000 * 60 * 200, status: 'Completed', isDeleted: false },
  { id: '3', name: 'Team offsite photos', type: 'image', size: '124 MB', sizeBytes: 130023424, date: 'Yesterday, 4:36 PM', timestamp: Date.now() - 1000 * 60 * 60 * 20, status: 'Completed', isDeleted: false },
  { id: '4', name: 'Product roadmap.docx', type: 'document', size: '1.8 MB', sizeBytes: 1887436, date: 'Yesterday, 2:05 PM', timestamp: Date.now() - 1000 * 60 * 60 * 22, status: 'Completed', isDeleted: false },
];

const getFiles = (): BackupFile[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FILES_KEY);
  if (!stored) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILES_KEY, JSON.stringify(initialFiles));
    }
    return initialFiles;
  }
  return JSON.parse(stored);
};

const saveFiles = (files: BackupFile[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
  }
};

const getLogs = (): ActionLog[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLogs = (logs: ActionLog[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
};

const addLog = (action: ActionLog['action'], fileName: string) => {
  const user = authService.getCurrentUser();
  if (!user) return;

  const logs = getLogs();
  const newLog: ActionLog = {
    id: crypto.randomUUID(),
    userId: user.id,
    userName: user.email.split('@')[0], // Simple username mock
    action,
    fileName,
    timestamp: Date.now(),
  };

  saveLogs([newLog, ...logs]);
};

export const awsService = {
  // File Management
  fetchFiles: async (): Promise<BackupFile[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getFiles();
  },

  uploadFile: async (file: File): Promise<BackupFile> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    let type: BackupFile['type'] = 'document';
    if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) type = 'archive';
    else if (file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) type = 'image';
    else if (file.name.match(/\.(xls|xlsx|csv)$/i)) type = 'spreadsheet';

    const sizeInMB = Math.max(1, Math.round(file.size / 1024 / 1024));

    const newFile: BackupFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      size: `${sizeInMB} MB`,
      sizeBytes: file.size,
      date: 'Just now',
      timestamp: Date.now(),
      status: 'Completed',
      isDeleted: false
    };

    const files = getFiles();
    saveFiles([newFile, ...files]);
    addLog('Upload', file.name);

    return newFile;
  },

  softDeleteFile: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex !== -1) {
      files[fileIndex].isDeleted = true;
      saveFiles(files);
      addLog('Delete', files[fileIndex].name);
    }
  },

  restoreFile: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex !== -1) {
      files[fileIndex].isDeleted = false;
      saveFiles(files);
      addLog('Restore', files[fileIndex].name);
    }
  },

  downloadFile: async (file: BackupFile): Promise<void> => {
      // In mock mode, we just pretend. In real mode we might redirect to S3 URL or fetch it
      if (USE_MOCK_AWS) {
          await delay(500)
          console.log(`Mock download for ${file.name}`)
      } else {
           // For real AWS, we would typically generate a GET presigned URL, but for simplicity here we just log it
          console.log(`Downloading ${file.name} from AWS (Implementation would require GET presigned URL endpoint)`)
      }
  }
}
    await new Promise(resolve => setTimeout(resolve, 400));
    addLog('Download', file.name);
  },

  // Admin Features
  getLogs: async (): Promise<ActionLog[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLogs();
  },

  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  toggleUserStatus: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const users: User[] = JSON.parse(stored);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].isActive = !users[userIndex].isActive;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  },

  getTotalStorage: async (): Promise<{ totalBytes: number, formatted: string }> => {
    const files = getFiles();
    const activeFiles = files.filter(f => !f.isDeleted);
    const totalBytes = activeFiles.reduce((acc, file) => acc + (file.sizeBytes || 0), 0);

    const inGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const inMB = (totalBytes / (1024 * 1024)).toFixed(2);

    return {
      totalBytes,
      formatted: totalBytes > 1024 * 1024 * 1024 ? `${inGB} GB` : `${inMB} MB`
    };
  }
};
