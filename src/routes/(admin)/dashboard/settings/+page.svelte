<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Badge } from "$lib/components/ui/badge";
	import { Shield, ShieldAlert, Trash2, UserPlus } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();
	let open = $state(false);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Settings</h1>
			<p class="text-muted-foreground">Manage access and store preferences.</p>
		</div>

		{#if data.isManager}
			<Dialog.Root bind:open>
				<Dialog.Trigger>
					<Button>
						<UserPlus class="mr-2 h-4 w-4" /> Add Staff
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Add New User</Dialog.Title>
					</Dialog.Header>
					<form
						action="?/createUser"
						method="POST"
						use:enhance={() =>
							async ({ result }) => {
								if (result.type === "success") open = false;
							}}
					>
						<div class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="username">Username</Label>
								<Input id="username" name="username" required />
							</div>
							<div class="grid gap-2">
								<Label for="password">Password</Label>
								<Input id="password" name="password" type="password" required />
							</div>
							<div class="grid gap-2">
								<Label for="role">Role</Label>
								<select
									name="role"
									class="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
								>
									<option value="barista">Barista</option>
									<option value="manager">Manager</option>
								</select>
							</div>
						</div>
						<Dialog.Footer>
							<Button type="submit">Create Account</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</div>

	{#if !data.isManager}
		<div class="bg-muted/20 rounded-lg border p-8 text-center">
			<ShieldAlert class="text-muted-foreground mx-auto mb-2 h-8 w-8" />
			<h3 class="font-bold">Restricted Access</h3>
			<p class="text-muted-foreground text-sm">Only managers can view settings.</p>
		</div>
	{:else}
		<div class="bg-card rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Username</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Action</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.users as user (user.id)}
						<Table.Row>
							<Table.Cell class="flex items-center gap-2 font-medium">
								{user.username}
								{#if user.role === "manager"}
									<Shield class="text-primary h-3 w-3" />
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class="capitalize">{user.role}</Badge>
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset"
									>Active</span
								>
							</Table.Cell>
							<Table.Cell class="text-right">
								<form action="?/deleteUser" method="POST" use:enhance>
									<input type="hidden" name="id" value={user.id} />
									<Button
										variant="ghost"
										size="icon"
										type="submit"
										class="text-destructive h-8 w-8"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
