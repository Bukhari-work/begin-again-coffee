<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Table from "$lib/components/ui/table";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Plus, Trash2 } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	import { buttonVariants } from "$lib/components/ui/button";
	let { data } = $props<{ data: PageData }>();

	// State to control modal open/close
	let open = $state(false);
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold tracking-tight">Inventory</h1>

	<Dialog.Root bind:open>
		<Dialog.Trigger class={buttonVariants({ variant: "default" })}>
			<Plus class="mr-2 h-4 w-4" /> Add Item
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Add New Product</Dialog.Title>
				<Dialog.Description>Add a new coffee or snack to your menu.</Dialog.Description>
			</Dialog.Header>

			<form
				action="?/create"
				method="POST"
				use:enhance={() => {
					return async ({ result, update }) => {
						// 1. Get the update function
						if (result.type === "success") {
							open = false;
						}
						await update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name" class="text-right">Name</Label>
						<Input id="name" name="name" class="col-span-3" required />
					</div>

					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="price" class="text-right">Price</Label>
						<Input
							id="price"
							name="price"
							type="number"
							step="0.01"
							class="col-span-3"
							required
						/>
					</div>

					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="category" class="text-right">Category</Label>
						<select
							name="category_id"
							class="border-input bg-background ring-offset-background col-span-3 flex h-10 w-full rounded-md border px-3 py-2 text-sm"
						>
							{#each data.categories as cat (cat.name)}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<Dialog.Footer>
					<Button type="submit">Save Product</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>

<div class="bg-card rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Category</Table.Head>
				<Table.Head class="text-right">Price</Table.Head>
				<Table.Head class="w-12"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.items as item (item.id)}
				<Table.Row>
					<Table.Cell class="font-medium">{item.name}</Table.Cell>
					<Table.Cell>{item.category_name || "-"}</Table.Cell>
					<Table.Cell class="text-right font-mono">{item.price}</Table.Cell>
					<Table.Cell>
						<div class="flex items-center gap-2">
							<a href="/dashboard/inventory/{item.id}/recipe">
								<Button variant="outline" size="sm" class="h-8">Recipe</Button>
							</a>
							<form action="?/delete" method="POST" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<Button
									variant="ghost"
									size="icon"
									type="submit"
									class="text-destructive h-8 w-8"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</form>
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
