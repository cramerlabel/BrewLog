import { ActionsManager } from '@/features/actions/ActionsManager';
import { UsersManager } from '@/features/users/UsersManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Admin-only user management and Actions-list editor.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="pt-4">
          <UsersManager />
        </TabsContent>
        <TabsContent value="actions" className="pt-4">
          <ActionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
