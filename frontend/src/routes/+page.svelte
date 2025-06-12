<script lang="ts">
	import { boardStore } from '$lib/stores/boardStore.svelte';
	import type { Task } from '$lib/stores/boardStore.svelte';
	import Column from '$lib/components/Column.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TaskModal from '$lib/components/TaskModal.svelte';
	import { onMount } from 'svelte';
	import PocketBase from 'pocketbase';
	import { slide } from 'svelte/transition';

	const { data } = $props();
	const { tasks } = data;

	// Convert RecordModel to Task type
	function convertToTask(record: any): Task {
		return {
			id: record.id,
			title: record.title,
			outcome: record.outcome || '',
			intensity: record.intensity || 5,
			tags: record.tags ? record.tags.split(',').map((tag: string) => tag.trim()) : [],
			dueDate: record.dueDate || null,
			estimatedTime: record.estimatedTime || 30,
			created: record.created || new Date().toISOString(),
			updated: record.updated || new Date().toISOString(),
			section: record.section,
			started: record.started || false,
			startTime: record.startTime,
			endTime: record.endTime,
			waitingFor: record.waitingFor,
			priority: record.priority || 'none',
			context: record.context || ''
		};
	}

	// Convert RecordModel to RecurringTask type
	function convertToRecurringTask(record: any): RecurringTask {
		const baseTask = convertToTask(record);
		return {
			...baseTask,
			streak: record.streak || 0,
			lastCompleted: record.lastCompleted || null,
			frequency: record.frequency || 'daily'
		};
	}
	function getCurrentTimePosition() {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		return Math.floor((hours + minutes / 60) * 120); // 120px per hour
	}

	function getTaskTimePosition(time: string) {
		const [hours, minutes] = time.split(':').map(Number);
		return Math.floor((hours + minutes / 60) * 120);
	}

	let showTaskModal = $state(false);
	let selectedColumnId = $state('');
	let searchQuery = $state('');
	let currentTime = $state(new Date());
	let zenTask: Task | null = null;
	let tasksContainer: HTMLElement;
	let pbUnsub: (() => void) | null = null;

	// Helper function to get tasks by section
	function getTasksBySection(section: string) {
		return tasks.map(convertToTask).filter((task) => task.section === section);
	}
	function updateCurrentTime() {
		currentTime = new Date();
		// Only update the position if the minute has changed
		if (tasksContainer) {
			const newPosition = getCurrentTimePosition();
			const currentPosition = parseInt(
				tasksContainer.style.getPropertyValue('--current-time-position') || '0'
			);
			if (newPosition !== currentPosition) {
				tasksContainer.style.setProperty('--current-time-position', newPosition.toString());
			}
		}
	}

	const timeSlots = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return `${hour}:00`;
	});

	function openTaskModal(columnId: string) {
		selectedColumnId = columnId;
		showTaskModal = true;
	}

	function closeTaskModal() {
		showTaskModal = false;
		selectedColumnId = '';
	}

	function handleTaskCreate(taskData: any) {
		const newTask = {
			...taskData,
			section: selectedColumnId,
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		};
		boardStore.addTask(convertToTask(newTask));
		closeTaskModal();
	}

	function openZenMode(task: Task) {
		zenTask = task;
	}

	function closeZenMode() {
		zenTask = null;
	}

	function handleTaskClick(task: Task) {
		const convertedTask = convertToTask(task);
		// Toggle started state
		boardStore.updateTask(task.id, {
			...convertedTask,
			started: !convertedTask.started
		});
		openZenMode(convertedTask);
	}

	interface RecurringTask extends Task {
		streak: number;
		lastCompleted: string | null;
		frequency: 'daily' | 'weekly' | 'monthly';
	}

	let recurringTasks = $state<RecurringTask[]>([]);

	function getStreakColor(streak: number): string {
		if (streak >= 7) return 'bg-green-100 text-green-800 border-green-200';
		if (streak >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	}

	function getStreakEmoji(streak: number): string {
		if (streak >= 7) return '🔥';
		if (streak >= 3) return '⭐';
		return '✨';
	}

	function findAvailableTimeSlots(existingTasks: Task[], taskDuration: number): string[] {
		const busySlots = new Set<string>();

		// Mark all busy time slots
		existingTasks.forEach((task) => {
			if (task.startTime && task.endTime) {
				const start = new Date(`2000-01-01T${task.startTime}`).getTime();
				const end = new Date(`2000-01-01T${task.endTime}`).getTime();
				for (let time = start; time < end; time += 30 * 60 * 1000) {
					// Check every 30 minutes
					busySlots.add(new Date(time).toTimeString().slice(0, 5));
				}
			}
		});

		// Find available slots
		const availableSlots: string[] = [];
		for (let hour = 8; hour < 18; hour++) {
			// Look between 8 AM and 6 PM
			for (let minute = 0; minute < 60; minute += 30) {
				// Check every 30 minutes
				const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				let isSlotAvailable = true;

				// Check if this slot and the next slots for the task duration are free
				for (let i = 0; i < taskDuration; i += 30) {
					const checkTime = new Date(`2000-01-01T${timeSlot}`).getTime() + i * 60 * 1000;
					const checkSlot = new Date(checkTime).toTimeString().slice(0, 5);
					if (busySlots.has(checkSlot)) {
						isSlotAvailable = false;
						break;
					}
				}

				if (isSlotAvailable) {
					availableSlots.push(timeSlot);
				}
			}
		}

		return availableSlots;
	}

	function getRandomTimeSlot(availableSlots: string[]): string {
		return availableSlots[Math.floor(Math.random() * availableSlots.length)];
	}

	onMount(() => {
		const interval = setInterval(updateCurrentTime, 60000);
		const existingTasks = boardStore.getTasksBySection('today');
		const today = new Date().toISOString().split('T')[0];

		recurringTasks.forEach((task) => {
			const existingTask = existingTasks.find(
				(t) => t.id.startsWith(task.id) && t.id.includes(today)
			);
			if (!existingTask) {
				const availableSlots = findAvailableTimeSlots(existingTasks, task.estimatedTime);
				if (availableSlots.length > 0) {
					const startTime = getRandomTimeSlot(availableSlots);
					const endTime = new Date(
						new Date(`2000-01-01T${startTime}`).getTime() + task.estimatedTime * 60 * 1000
					)
						.toTimeString()
						.slice(0, 5);
					const todayTask = {
						...task,
						id: `${task.id}-${today}`,
						section: 'today',
						startTime,
						endTime,
						created: new Date().toISOString(),
						updated: new Date().toISOString()
					};
					boardStore.addTask(todayTask);
				}
			}
		});
		recurringTasks = tasks
			.map(convertToRecurringTask)
			.filter((task) => task.section === 'recurring');

		// --- PocketBase realtime subscription ---
		(async () => {
			const pb = new PocketBase('https://life-manager-database1-wispy-thunder-4413.fly.dev');
			const unsub = await pb.collection('tasks').subscribe('*', (e) => {
				if (e.action === 'create') {
					boardStore.addTask(convertToTask(e.record));
				} else if (e.action === 'update') {
					boardStore.updateTask(e.record.id, convertToTask(e.record));
				} else if (e.action === 'delete') {
					boardStore.deleteTask(e.record.id);
				}
			});
			pbUnsub = typeof unsub === 'function' ? unsub : null;
		})();

		return () => {
			clearInterval(interval);
			if (pbUnsub) pbUnsub();
		};
	});
</script>

<svelte:head>
	<title>GTD Life Manager</title>
	<meta name="description" content="Getting Things Done with style" />
</svelte:head>

{#if zenTask}
	<div class="fixed inset-0 z-50 flex flex-col bg-gray-900">
		<div class="flex items-center justify-between border-b border-gray-700 p-4">
			<h1 class="text-xl font-semibold text-gray-100">Zen Mode</h1>
			<button
				onclick={closeZenMode}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
			>
				✕
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-8">
			<div class="mx-auto max-w-3xl">
				<h2 class="mb-4 text-3xl font-bold text-gray-100">{zenTask.title}</h2>

				{#if zenTask.outcome}
					<p class="mb-6 text-gray-400">{zenTask.outcome}</p>
				{/if}

				<div class="grid grid-cols-2 gap-6">
					<div class="rounded-lg bg-gray-800 p-4">
						<h3 class="mb-2 text-sm font-medium text-gray-500">Context</h3>
						<p class="text-gray-100">{zenTask.context || 'No context'}</p>
					</div>

					<div class="rounded-lg bg-gray-800 p-4">
						<h3 class="mb-2 text-sm font-medium text-gray-500">Priority</h3>
						<p class="capitalize text-gray-100">{zenTask.priority || 'Not set'}</p>
					</div>

					{#if zenTask.estimatedTime}
						<div class="rounded-lg bg-gray-800 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-500">Estimated Time</h3>
							<p class="text-gray-100">{zenTask.estimatedTime} minutes</p>
						</div>
					{/if}

					{#if zenTask.tags?.length}
						<div class="rounded-lg bg-gray-800 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-500">Tags</h3>
							<div class="flex flex-wrap gap-2">
								{#each zenTask.tags as tag}
									<span class="rounded-full bg-gray-700 px-2 py-1 text-sm text-gray-300">
										{tag}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="grid h-[100vh] grid-rows-[auto_1fr] gap-4 overflow-hidden bg-gray-900 p-4">
		<!-- Row 1 -->
		<div class="grid grid-cols-[1fr_4fr] gap-4">
			<div
				class="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 p-4 text-xl font-bold text-gray-100 shadow"
			>
				🧠 Life Manager
			</div>
			<div
				class="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 p-4 text-xl font-bold text-gray-100 shadow"
			>
				📥 Inbox
			</div>
		</div>

		<!-- Row 2 -->
		<div class="grid min-h-0 grid-cols-[1fr_2fr_1fr] gap-4">
			<!-- Left Column: Can do now + Recurring Tasks -->
			<div class="flex min-h-0 flex-col gap-4">
				<!-- Can do now -->
				<div
					class="flex h-[calc(50%-0.5rem)] flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
				>
					<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-100">Can do now</h2>
							<button
								onclick={() => openTaskModal('can-do-now')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('can-do-now') as task (task.id)}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
								transition:slide
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-100"
										>
											{#if task.started}
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
											{/if}
											{task.title}
										</h3>
										<span
											class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${
												task.priority === 'high'
													? 'border border-red-200/50 bg-red-100/70 text-red-800'
													: task.priority === 'medium'
														? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
														: 'border border-green-200/50 bg-green-100/70 text-green-800'
											}`}
										>
											{task.priority}
										</span>
									</div>

									<div class="flex items-center justify-between text-xs text-gray-500">
										<span class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm">
											{task.context}
										</span>
									</div>
								</div>
							</div>
						{/each}

						{#if getTasksBySection('can-do-now').length === 0}
							<div class="flex h-full items-center justify-center text-gray-400">
								<div class="text-center">
									<div class="mb-2 text-2xl">✨</div>
									<p class="text-sm">No tasks in can do now</p>
									<button
										onclick={() => openTaskModal('can-do-now')}
										class="mt-1 text-xs text-blue-600 hover:text-blue-800"
									>
										Add your first task
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Recurring Tasks -->
				<div
					class="flex h-[calc(50%-0.5rem)] flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
				>
					<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-100">Recurring Tasks</h2>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each recurringTasks as task (task.id)}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
								animate:flip
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-100"
										>
											{#if task.started}
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
											{/if}
											{task.title}
										</h3>
										<div class="flex items-center space-x-2">
											<span
												class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${getStreakColor(task.streak)}`}
											>
												{getStreakEmoji(task.streak)}
												{task.streak} days
											</span>
											<span
												class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
													task.priority === 'high'
														? 'border border-red-200/50 bg-red-100/70 text-red-800'
														: task.priority === 'medium'
															? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
															: 'border border-green-200/50 bg-green-100/70 text-green-800'
												}`}
											>
												{task.priority}
											</span>
										</div>
									</div>

									<div class="flex items-center justify-between text-xs text-gray-500">
										<span class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm">
											{task.context}
										</span>
										<span class="text-gray-500">
											{task.estimatedTime} min
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Middle Column: Today's Schedule -->
			<div
				class="flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
			>
				<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
					<div class="mb-2 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-100">Today's Schedule</h2>
						<button
							onclick={() => openTaskModal('today')}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
							title="Add task"
						>
							+
						</button>
					</div>
				</div>

				<div class="min-h-0 overflow-y-auto">
					<div class="grid min-h-0 grid-cols-[100px_1fr]">
						<!-- Time slots -->
						<div class="h-full min-h-0 overflow-y-auto border-r border-gray-700">
							{#each timeSlots as timeSlot}
								<div class="h-30 flex items-center justify-center border-b border-gray-600">
									<span class="text-sm text-gray-500">{timeSlot}</span>
								</div>
							{/each}
						</div>

						<!-- Tasks -->
						<div class="relative h-full" bind:this={tasksContainer}>
							<!-- Time grid lines -->
							{#each timeSlots as timeSlot}
								<div
									class="h-30 absolute left-0 right-0 border-b border-gray-600"
									style="top: {timeSlots.indexOf(timeSlot) * 120}px;"
								></div>
							{/each}

							<!-- Now indicator line -->
							<div
								class="absolute left-0 right-0 z-10 h-0.5 bg-red-500"
								style="top: {getCurrentTimePosition()}px;"
							>
								<div
									class="absolute -left-2 -top-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white"
								>
									Now
								</div>
							</div>

							<!-- Tasks -->
							{#each getTasksBySection('today') as task (task.id)}
								{@const startTime = task.startTime ? new Date(task.startTime) : new Date()}
								{@const endTime = task.endTime ? new Date(task.endTime) : new Date()}
								{@const startHour = startTime.getHours()}
								{@const startMinute = startTime.getMinutes()}
								{@const endHour = endTime.getHours()}
								{@const endMinute = endTime.getMinutes()}
								{@const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)}
								{@const top = (startHour + startMinute / 60) * 120}
								{@const height = Math.max(duration * 120, 30)}
								{@const isRecurring = recurringTasks.some((rt) => rt.id === task.id)}
								{@const isCompact = height < 80}

								<div
									onclick={() => handleTaskClick(task)}
									class="absolute left-0 right-0 cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
									style="top: {top}px; height: {height}px;"
									transition:slide
								>
									<div class="p-3 {isCompact ? 'py-1' : ''}">
										<div class="flex items-start justify-between {isCompact ? 'mb-0' : 'mb-1'}">
											<h3
												class="mr-2 flex flex-1 items-center gap-2 truncate text-sm font-medium leading-tight text-gray-100"
											>
												{#if task.started}
													<span class="h-2 w-2 rounded-full bg-green-500"></span>
												{/if}
												{task.title}
												{#if isRecurring}
													<span class="ml-1 inline-block text-xs text-blue-600">🔄</span>
												{/if}
											</h3>
											{#if !isCompact}
												<span
													class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
														task.priority === 'high'
															? 'border border-red-200/50 bg-red-100/70 text-red-800'
															: task.priority === 'medium'
																? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
																: 'border border-green-200/50 bg-green-100/70 text-green-800'
													}`}
												>
													{task.priority}
												</span>
											{/if}
										</div>

										{#if !isCompact}
											<div class="flex items-center justify-between text-xs text-gray-500">
												<span
													class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm"
												>
													{task.context}
												</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}

							{#if getTasksBySection('today').length === 0}
								<div class="absolute inset-0 flex items-center justify-center text-gray-400">
									<div class="text-center">
										<div class="mb-2 text-2xl">✨</div>
										<p class="text-sm">No tasks for today</p>
										<button
											onclick={() => openTaskModal('today')}
											class="mt-1 text-xs text-blue-600 hover:text-blue-800"
										>
											Add your first task
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Waiting + Someday + Reference -->
			<div class="flex min-h-0 flex-col gap-4">
				<!-- Waiting For -->
				<div
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
				>
					<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-100">Waiting For</h2>
							<button
								onclick={() => openTaskModal('waiting-for')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('waiting-for') as task (task.id)}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
								animate:flip
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-100"
										>
											{#if task.started}
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
											{/if}
											{task.title}
										</h3>
										<span
											class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
												task.priority === 'high'
													? 'border border-red-200/50 bg-red-100/70 text-red-800'
													: task.priority === 'medium'
														? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
														: 'border border-green-200/50 bg-green-100/70 text-green-800'
											}`}
										>
											{task.priority}
										</span>
									</div>

									<div class="flex items-center justify-between text-xs text-gray-500">
										<span class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm">
											{task.context}
										</span>
										{#if task.waitingFor}
											<span class="text-gray-500">
												Waiting for: {task.waitingFor}
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Someday -->
				<div
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
				>
					<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-100">Someday</h2>
							<button
								onclick={() => openTaskModal('someday')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('someday') as task (task.id)}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
								animate:flip
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-100"
										>
											{#if task.started}
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
											{/if}
											{task.title}
										</h3>
										<span
											class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
												task.priority === 'high'
													? 'border border-red-200/50 bg-red-100/70 text-red-800'
													: task.priority === 'medium'
														? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
														: 'border border-green-200/50 bg-green-100/70 text-green-800'
											}`}
										>
											{task.priority}
										</span>
									</div>

									<div class="flex items-center justify-between text-xs text-gray-500">
										<span class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm">
											{task.context}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Reference -->
				<div
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow"
				>
					<div class="shrink-0 border-b border-gray-700 bg-gray-800 p-4">
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-100">Reference</h2>
							<button
								onclick={() => openTaskModal('reference')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl text-gray-300 transition-colors duration-200 hover:bg-gray-600 hover:text-white"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('reference') as task (task.id)}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-gray-700 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-100"
										>
											{#if task.started}
												<span class="h-2 w-2 rounded-full bg-green-500"></span>
											{/if}
											{task.title}
										</h3>
										<span
											class={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
												task.priority === 'high'
													? 'border border-red-200/50 bg-red-100/70 text-red-800'
													: task.priority === 'medium'
														? 'border border-yellow-200/50 bg-yellow-100/70 text-yellow-800'
														: 'border border-green-200/50 bg-green-100/70 text-green-800'
											}`}
										>
											{task.priority}
										</span>
									</div>

									<div class="flex items-center justify-between text-xs text-gray-500">
										<span class="rounded-md bg-gray-800/50 px-2 py-1 font-mono backdrop-blur-sm">
											{task.context}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showTaskModal}
	<TaskModal {selectedColumnId} onClose={closeTaskModal} onCreate={handleTaskCreate} />
{/if}
