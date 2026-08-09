'use client'

import { useMemo, useRef, useState, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { authService, type User } from '@/lib/authService'
import { awsService, type BackupFile, type ActionLog } from '@/lib/awsService'
import {
  Activity,
  Archive,
  ArrowDownToLine,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Database,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Files,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

const fileIcon = { document: FileText, image: FileImage, spreadsheet: FileSpreadsheet, archive: FileArchive }

function Logo() {
  return <div className="flex items-center gap-2.5"><div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Cloud className="size-4" /></div><span className="font-semibold tracking-tight text-sidebar-foreground">CloudVault</span></div>
}

function Sidebar({ view, setView, user, onLogout }: { view: 'backups' | 'admin'; setView: (view: 'backups' | 'admin') => void; user: User; onLogout: () => void }) {
  const [totalStorage, setTotalStorage] = useState<{ totalBytes: number, formatted: string }>({ totalBytes: 0, formatted: '0 MB' })
  useEffect(() => {
    awsService.getTotalStorage().then(setTotalStorage)
  }, [view])

  const usagePercent = Math.min(100, Math.round((totalStorage.totalBytes / (10 * 1024 * 1024 * 1024)) * 100))

  return <aside className="hidden w-[248px] shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex">
    <Logo />
    <div className="mt-10 flex flex-1 flex-col gap-7">
      <div><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">Workspace</p><nav className="flex flex-col gap-1">
        <button onClick={() => setView('backups')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${view === 'backups' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><LayoutDashboard className="size-4" />My Backups</button>
        {user.role === 'admin' && (
          <button onClick={() => setView('admin')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${view === 'admin' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><BarChart3 className="size-4" />Admin Panel</button>
        )}
      </nav></div>
      <div><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">Manage</p><nav className="flex flex-col gap-1"><button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"><Settings className="size-4" />Settings</button><button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"><LifeBuoy className="size-4" />Help center</button></nav></div>
    </div>
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5"><div className="mb-2 flex items-center justify-between"><span className="text-xs text-sidebar-foreground/70">Storage used</span><HardDrive className="size-3.5 text-sidebar-foreground/50" /></div><div className="mb-2 flex items-end justify-between"><span className="text-sm font-medium">{totalStorage.formatted}</span><span className="text-[11px] text-sidebar-foreground/50">of 10 GB</span></div><Progress value={usagePercent} className="h-1.5 bg-sidebar-foreground/10" /><p className="mt-2 text-[10px] text-sidebar-foreground/45">{100 - usagePercent}% remaining</p></div>
    <div className="mt-5 flex items-center gap-2.5 border-t border-sidebar-border pt-4"><div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{user.email.substring(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{user.email.split('@')[0]}</p><p className="truncate text-[10px] text-sidebar-foreground/50">{user.email}</p></div><button aria-label="Sign out" onClick={onLogout} className="text-sidebar-foreground/45 hover:text-sidebar-foreground"><LogOut className="size-3.5" /></button></div>
  </aside>
}

function Header({ view, user }: { view: 'backups' | 'admin'; user: User }) {
  return <header className="flex h-[72px] items-center justify-between border-b border-border bg-card px-5 md:px-8"><div className="flex items-center gap-3 lg:hidden"><Logo /></div><div className="hidden lg:block"><p className="text-xs text-muted-foreground">Workspace / <span className="text-foreground">{view === 'backups' ? 'My Backups' : 'Admin Panel'}</span></p></div><div className="flex items-center gap-3"><button aria-label="Notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" /></button><Separator orientation="vertical" className="h-5" /><button className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-muted"><div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{user.email.substring(0, 2).toUpperCase()}</div><span className="hidden text-xs font-medium sm:inline">{user.email.split('@')[0]}</span><ChevronDown className="size-3.5 text-muted-foreground" /></button></div></header>
}

function UserDashboard() {
  const [files, setFiles] = useState<BackupFile[]>([])
  const [query, setQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [tab, setTab] = useState<'active' | 'trash'>('active')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    awsService.fetchFiles().then(setFiles)
  }, [])

  const filteredFiles = useMemo(() => files.filter((file) => {
    if ((tab === 'active' && file.isDeleted) || (tab === 'trash' && !file.isDeleted)) return false;
    const q = query.toLowerCase();
    return file.name.toLowerCase().includes(q) ||
           file.size.toLowerCase().includes(q) ||
           file.date.toLowerCase().includes(q);
  }), [files, query, tab])

  const handleUpload = async (selected: FileList | File[]) => {
    const file = selected[0];
    if (!file) return;
    const newFile = await awsService.uploadFile(file);
    setFiles((current) => [newFile, ...current]);
    toast.success(`${file.name} added to your backups`)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); void handleUpload(event.dataTransfer.files) }
  const onPick = (event: ChangeEvent<HTMLInputElement>) => { void handleUpload(event.target.files ?? []) }

  const action = async (kind: 'download' | 'restore' | 'delete', file: BackupFile) => {
    if (kind === 'delete') {
      await awsService.softDeleteFile(file.id);
      setFiles((current) => current.map((item) => item.id === file.id ? { ...item, isDeleted: true } : item));
      toast.success(`${file.name} moved to trash`)
    } else if (kind === 'restore') {
      await awsService.restoreFile(file.id);
      setFiles((current) => current.map((item) => item.id === file.id ? { ...item, isDeleted: false } : item));
      toast.success(`${file.name} restored to active backups`)
    } else {
      await awsService.downloadFile(file);
      toast.success(`Downloading ${file.name}`)
    }
  }

  const activeCount = files.filter(f => !f.isDeleted).length;

  return <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-9"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><Zap className="size-3.5 fill-current" />ALL SYSTEMS OPERATIONAL</div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Good morning, Jordan</h1><p className="mt-1 text-sm text-muted-foreground">Keep your important files safe and accessible.</p></div><Button onClick={() => inputRef.current?.click()} className="w-full sm:w-auto"><Plus data-icon="inline-start" />New backup</Button><input ref={inputRef} type="file" className="hidden" onChange={onPick} /></div>
    <div className="mb-7 grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Total backups</span><div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Archive className="size-4" /></div></div><div className="flex items-baseline gap-1.5"><span className="text-2xl font-semibold tracking-tight">{activeCount}</span><span className="text-sm text-muted-foreground">files</span></div></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Last backup</span><div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"><RefreshCw className="size-4" /></div></div><div className="flex items-baseline gap-1.5"><span className="text-2xl font-semibold tracking-tight">Today</span></div><p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CheckCircle2 className="size-3.5 text-emerald-600" />Completed at 10:42 AM</p></div></div>
    <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} className={`mb-8 flex min-h-[156px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}><div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UploadCloud className="size-5" /></div><p className="text-sm font-medium">Drop files here to back them up</p><p className="mt-1 text-xs text-muted-foreground">or <button onClick={() => inputRef.current?.click()} className="font-medium text-primary hover:underline">browse from your computer</button></p><p className="mt-3 text-[10px] text-muted-foreground">Maximum file size: 5 GB</p></div>
    <div className="flex flex-col gap-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-2">
        <Button variant={tab === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setTab('active')}>Active Backups</Button>
        <Button variant={tab === 'trash' ? 'default' : 'outline'} size="sm" onClick={() => setTab('trash')}>Trash</Button>
      </div>
      <div className="relative w-full sm:w-56"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search backups..." className="h-9 pl-9 text-xs" /></div>
    </div><div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Size</th><th className="px-5 py-3 font-medium">Uploaded</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border">{filteredFiles.map((file) => { const Icon = fileIcon[file.type]; return <tr key={file.id} className="group hover:bg-muted/25"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></div><span className="font-medium text-foreground">{file.name}</span></div></td><td className="px-5 py-4 text-muted-foreground">{file.size}</td><td className="px-5 py-4 text-muted-foreground">{file.date}</td><td className="px-5 py-4"><Badge variant={file.status === 'Completed' ? 'secondary' : 'outline'} className={file.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10' : ''}>{file.status === 'Completed' && <CheckCircle2 data-icon="inline-start" />}{file.status}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
      {tab === 'active' ? (
        <>
          <Button variant="ghost" size="icon" aria-label={`Download ${file.name}`} onClick={() => void action('download', file)}><ArrowDownToLine /></Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${file.name}`} onClick={() => void action('delete', file)}><Trash2 /></Button>
        </>
      ) : (
        <Button variant="ghost" size="icon" aria-label={`Restore ${file.name}`} onClick={() => void action('restore', file)}><RefreshCw /></Button>
      )}
    </div></td></tr> })}</tbody></table>{filteredFiles.length === 0 && <div className="flex flex-col items-center gap-2 px-6 py-12 text-center"><Files className="size-7 text-muted-foreground/50" /><p className="text-sm font-medium">No backups found</p><p className="text-xs text-muted-foreground">Try another search term.</p></div>}</div></div></div>
  </div>
}

function AdminPanel() {
  const [totalStorage, setTotalStorage] = useState<{ totalBytes: number, formatted: string }>({ totalBytes: 0, formatted: '0 MB' })
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const [storage, userList, logList] = await Promise.all([
      awsService.getTotalStorage(),
      awsService.getUsers(),
      awsService.getLogs()
    ])
    setTotalStorage(storage)
    setUsers(userList)
    setLogs(logList)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleUser = async (userId: string) => {
    await awsService.toggleUserStatus(userId)
    setUsers(current => current.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u))
    toast.success('User status updated')
  }

  const activeUsersCount = users.filter(u => u.isActive).length

  return <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:py-9"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><ShieldCheck className="size-3.5" />SYSTEM OVERVIEW</div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Admin panel</h1><p className="mt-1 text-sm text-muted-foreground">Monitor your workspace activity and storage.</p></div><Button onClick={fetchData} disabled={loading} variant="outline"><RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : ""} />Refresh data</Button></div><div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">Total storage</p><p className="mt-3 text-2xl font-semibold">{totalStorage.formatted}</p><p className="mt-1 text-xs text-emerald-600">Updated just now</p></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">Active users</p><p className="mt-3 text-2xl font-semibold">{activeUsersCount}</p><p className="mt-1 text-xs text-muted-foreground">Out of {users.length} total</p></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">System logs</p><p className="mt-3 text-2xl font-semibold">{logs.length}</p><p className="mt-1 text-xs text-emerald-600">Events tracked</p></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">System uptime</p><p className="mt-3 text-2xl font-semibold">99.99%</p><p className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><Activity className="size-3" />All systems normal</p></div></div><div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Manage Users</h2><p className="mt-1 text-xs text-muted-foreground">Activate or deactivate workspace members.</p></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border">{users.map((u) => <tr key={u.id} className="hover:bg-muted/25"><td className="px-4 py-3 font-medium">{u.email}</td><td className="px-4 py-3 text-muted-foreground capitalize">{u.role}</td><td className="px-4 py-3"><Badge variant={u.isActive ? 'secondary' : 'outline'} className={u.isActive ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10' : 'bg-red-500/10 text-red-700 hover:bg-red-500/10'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td><td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => handleToggleUser(u.id)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button></td></tr>)}</tbody></table>{users.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No users found</div>}</div></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Latest workspace events.</p></div></div><div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">{logs.map((log) => <div key={log.id} className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Activity className="size-3.5" /></div><div><p className="text-xs leading-5"><span className="font-medium">{log.userName}</span> {log.action.toLowerCase()}d <span className="font-medium">{log.fileName}</span></p><p className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p></div></div>)}{logs.length === 0 && <p className="text-xs text-muted-foreground">No recent activity.</p>}</div></div></div></div>
}

function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await authService.login(email, password)
        toast.success('Logged in successfully')
      } else {
        await authService.signUp(email, password, 'user')
        toast.success('Signed up successfully')
      }
      onAuthSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </Button>
          </div>
        </form>
        <div className="text-center text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CloudVaultDashboard() {
  const [view, setView] = useState<'backups' | 'admin'>('backups')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setView('backups')
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><RefreshCw className="size-8 animate-spin text-primary" /></div>
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => setUser(authService.getCurrentUser())} />
  }

  return <div className="flex min-h-screen bg-background"><Sidebar view={view} setView={setView} user={user} onLogout={handleLogout} /><div className="flex min-w-0 flex-1 flex-col"><Header view={view} user={user} /><main className="flex-1">{view === 'backups' ? <UserDashboard /> : <AdminPanel />}</main><footer className="flex items-center justify-between border-t border-border px-5 py-4 text-[10px] text-muted-foreground md:px-8"><span>CloudVault © 2025</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />Secure and encrypted</span></footer></div></div>
}
