<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Plus, Trash2, Milk } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();
	let open = $state(false);
</script>

<div class="mb-6 flex items-center justify-between">
	<div class="flex items-center gap-2">
		<Milk class="text-primary h-6 w-6" />
		<h1 class="text-2xl font-bold tracking-tight">Ingredients</h1>
	</div>

	<Dialog.Root bind:open>
		<Dialog.Trigger>
			<Button><Plus class="mr-2 h-4 w-4" /> New Ingredient</Button>
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Add Ingredient</Dialog.Title>
			</Dialog.Header>
			<form
				action="?/create"
				method="POST"
				use:enhance={() =>
					async ({ result }) => {
						if (result.type === "success") open = false;
					}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name" class="text-right">Name</Label>
						<Input
							id="name"
							name="name"
							placeholder="Espresso Beans"
							class="col-span-3"
							required
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="unit" class="text-right">Unit</Label>
						<select
							name="unit"
							class="bg-background col-span-3 flex h-10 w-full rounded-md border px-3"
						>
							<option value="grams">grams (g)</option>
							<option value="ml">milliliters (ml)</option>
							<option value="pcs">pieces (pcs)</option>
						</select>
					</div>
				</div>
				<Dialog.Footer><Button type="submit">Save</Button></Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>

<div class="bg-card rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Ingredient</Table.Head>
				<Table.Head>Unit</Table.Head>
				<Table.Head class="w-12"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.ingredients as ing (ing.id)}
				<Table.Row>
					<Table.Cell class="font-medium">{ing.name}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{ing.unit}</Table.Cell>
					<Table.Cell>
						<form action="?/delete" method="POST" use:enhance>
							<input type="hidden" name="id" value={ing.id} />
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
