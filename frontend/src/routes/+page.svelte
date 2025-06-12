<script lang="ts">
	import { boardStore } from '$lib/stores/boardStore.svelte';
	import type { Task } from '$lib/stores/boardStore.svelte';
	import Column from '$lib/components/Column.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TaskModal from '$lib/components/TaskModal.svelte';
	import { onMount } from 'svelte';

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

	let showTaskModal = $state(false);
	let selectedColumnId = $state('');
	let searchQuery = $state('');
	let draggedTask = $state<Task | null>(null);
	let draggedOverTime = $state<string | null>(null);
	let currentTime = $state(new Date());
	let activeTask = $state<Task | null>(null);
	let tasksContainer: HTMLElement;

	// Helper function to get tasks by section
	function getTasksBySection(section: string) {
		return tasks.map(convertToTask).filter((task) => task.section === section);
	}

	const timeSlots = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return `${hour}:00`;
	});

	function getCurrentTimePosition() {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		return (hours + minutes / 60) * 120; // 120px per hour
	}

	function scrollToCurrentTime() {
		if (tasksContainer) {
			const position = getCurrentTimePosition();
			tasksContainer.scrollTop = position - tasksContainer.clientHeight / 2;
		}
	}

	function updateCurrentTime() {
		currentTime = new Date();
	}

	function handleDragStart(event: DragEvent, task: Task) {
		draggedTask = convertToTask(task);
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', task.id);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent, targetColumn: string, timeSlot?: string) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		if (timeSlot) {
			draggedOverTime = timeSlot;
		}
	}

	function handleDrop(event: DragEvent, targetColumn: string, timeSlot?: string) {
		event.preventDefault();
		if (draggedTask) {
			if (targetColumn === 'today' && timeSlot) {
				const [hours, minutes] = timeSlot.split(':').map(Number);
				const duration = 1; // Default 1 hour duration for tasks moved to today

				const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
				const newEndTime = new Date(
					new Date(`2000-01-01T${newStartTime}`).getTime() + duration * 60 * 60 * 1000
				)
					.toTimeString()
					.slice(0, 5);

				boardStore.updateTask(draggedTask.id, {
					...draggedTask,
					section: 'today',
					startTime: newStartTime,
					endTime: newEndTime
				});
			} else {
				// Moving to "Can do now" - remove time information
				const { startTime, endTime, ...taskWithoutTime } = draggedTask;
				boardStore.updateTask(draggedTask.id, {
					...taskWithoutTime,
					section: 'can-do-now'
				});
			}
		}
		draggedTask = null;
		draggedOverTime = null;
	}

	function handleDragEnd() {
		draggedTask = null;
		draggedOverTime = null;
	}

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

	function handleTaskClick(task: Task) {
		const convertedTask = convertToTask(task);
		// Toggle started state
		boardStore.updateTask(task.id, {
			...convertedTask,
			started: !convertedTask.started
		});
		activeTask = convertedTask;
	}

	function exitZenMode() {
		activeTask = null;
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
		scrollToCurrentTime();
		// Update current time every minute
		const interval = setInterval(updateCurrentTime, 60000);

		// Get recurring tasks from the live data
		recurringTasks = tasks
			.map(convertToRecurringTask)
			.filter((task) => task.section === 'recurring');

		return () => clearInterval(interval);
	});

	$effect(() => {
		// Update current time position when it changes
		if (tasksContainer) {
			scrollToCurrentTime();
		}
	});
</script>

<svelte:head>
	<title>GTD Life Manager</title>
	<meta name="description" content="Getting Things Done with style" />
</svelte:head>

{#if activeTask}
	<div class="fixed inset-0 z-50 flex flex-col bg-white">
		<div class="flex items-center justify-between border-b border-gray-100 p-4">
			<h1 class="text-xl font-semibold text-gray-900">Zen Mode</h1>
			<button
				onclick={exitZenMode}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
			>
				✕
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-8">
			<div class="mx-auto max-w-3xl">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">{activeTask.title}</h2>

				{#if activeTask.outcome}
					<p class="mb-6 text-gray-600">{activeTask.outcome}</p>
				{/if}

				<div class="grid grid-cols-2 gap-6">
					<div class="rounded-lg bg-gray-50 p-4">
						<h3 class="mb-2 text-sm font-medium text-gray-500">Context</h3>
						<p class="text-gray-900">{activeTask.context || 'No context'}</p>
					</div>

					<div class="rounded-lg bg-gray-50 p-4">
						<h3 class="mb-2 text-sm font-medium text-gray-500">Priority</h3>
						<p class="capitalize text-gray-900">{activeTask.priority || 'Not set'}</p>
					</div>

					{#if activeTask.estimatedTime}
						<div class="rounded-lg bg-gray-50 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-500">Estimated Time</h3>
							<p class="text-gray-900">{activeTask.estimatedTime} minutes</p>
						</div>
					{/if}

					{#if activeTask.tags?.length}
						<div class="rounded-lg bg-gray-50 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-500">Tags</h3>
							<div class="flex flex-wrap gap-2">
								{#each activeTask.tags as tag}
									<span class="rounded-full bg-gray-200 px-2 py-1 text-sm text-gray-700">
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
	<div
		class="grid h-[100vh] grid-rows-[auto_1fr] gap-4 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 p-4"
	>
		<!-- Row 1 -->
		<div class="grid grid-cols-[1fr_4fr] gap-4">
			<div
				class="flex items-center justify-center rounded-lg bg-white p-4 text-xl font-bold shadow"
			>
				🧠 Life Manager
			</div>
			<div
				class="flex items-center justify-center rounded-lg bg-white p-4 text-xl font-bold shadow"
			>
				📥 Inbox
			</div>
		</div>

		<!-- Row 2 -->
		<div class="grid min-h-0 grid-cols-[1fr_2fr_1fr] gap-4">
			<!-- Left Column: Can do now + Recurring Tasks -->
			<div class="flex min-h-0 flex-col gap-4">
				<!-- Can do now -->
				<div class="flex h-[calc(50%-0.5rem)] flex-col overflow-hidden rounded-lg bg-white shadow">
					<div
						class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
					>
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Can do now</h2>
							<button
								onclick={() => openTaskModal('can-do-now')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div
						class="flex-1 space-y-3 overflow-y-auto p-4"
						ondragover={(e) => handleDragOver(e, 'can-do-now')}
						ondrop={(e) => handleDrop(e, 'can-do-now')}
						ondragend={handleDragEnd}
					>
						{#each getTasksBySection('can-do-now') as task}
							<div
								draggable="true"
								ondragstart={(e) => handleDragStart(e, task)}
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-900"
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
										<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
				<div class="flex h-[calc(50%-0.5rem)] flex-col overflow-hidden rounded-lg bg-white shadow">
					<div
						class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
					>
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Recurring Tasks</h2>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each recurringTasks as task}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-900"
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
										<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
			<div class="flex flex-col overflow-hidden rounded-lg bg-white shadow">
				<div
					class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
				>
					<div class="mb-2 flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-900">Today's Schedule</h2>
						<button
							onclick={() => openTaskModal('today')}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
							title="Add task"
						>
							+
						</button>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<div class="grid h-[2880px] min-h-0 grid-cols-[100px_1fr]">
						<!-- Time slots -->
						<div class="h-full min-h-0 overflow-y-auto border-r border-gray-200">
							{#each timeSlots as timeSlot}
								<div class="h-30 flex items-center justify-center border-b border-gray-100">
									<span class="text-sm text-gray-500">{timeSlot}</span>
								</div>
							{/each}
						</div>

						<!-- Tasks -->
						<div class="relative h-full min-h-0 overflow-y-auto" bind:this={tasksContainer}>
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

							{#each timeSlots as timeSlot}
								<div
									class="h-30 border-b border-gray-100"
									ondragover={(e) => handleDragOver(e, 'today', timeSlot)}
									ondrop={(e) => handleDrop(e, 'today', timeSlot)}
									ondragend={handleDragEnd}
								></div>
							{/each}

							{#each getTasksBySection('today') as task}
								{@const startHour = parseInt(task.startTime?.split(':')[0] || '0')}
								{@const startMinute = parseInt(task.startTime?.split(':')[1] || '0')}
								{@const endHour = parseInt(task.endTime?.split(':')[0] || '0')}
								{@const endMinute = parseInt(task.endTime?.split(':')[1] || '0')}
								{@const duration = endHour - startHour + (endMinute - startMinute) / 60}
								{@const top = (startHour + startMinute / 60) * 120}
								{@const height = duration * 120}
								{@const isRecurring = recurringTasks.some((rt) => rt.id === task.id)}
								{@const isCompact = height < 80}

								<div
									draggable="true"
									ondragstart={(e) => handleDragStart(e, task)}
									onclick={() => handleTaskClick(task)}
									class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
									style="top: {top}px; height: {height}px;"
								>
									<div class="p-3 {isCompact ? 'py-1' : ''}">
										<div class="flex items-start justify-between {isCompact ? 'mb-0' : 'mb-1'}">
											<h3
												class="mr-2 flex flex-1 items-center gap-2 truncate text-sm font-medium leading-tight text-gray-900"
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
												<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
					>
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Waiting For</h2>
							<button
								onclick={() => openTaskModal('waiting-for')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('waiting-for') as task}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-900"
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
										<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
					>
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Someday</h2>
							<button
								onclick={() => openTaskModal('someday')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('someday') as task}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-900"
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
										<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
					class="flex h-[calc(33.333%-0.67rem)] flex-col overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="shrink-0 border-b border-white/50 bg-gradient-to-r from-white/50 to-white/30 p-4"
					>
						<div class="mb-2 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Reference</h2>
							<button
								onclick={() => openTaskModal('reference')}
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-600"
								title="Add task"
							>
								+
							</button>
						</div>
					</div>

					<div class="flex-1 space-y-3 overflow-y-auto p-4">
						{#each getTasksBySection('reference') as task}
							<div
								onclick={() => handleTaskClick(task)}
								class="cursor-pointer rounded-lg border border-white/50 bg-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/70 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]"
							>
								<div class="p-3">
									<div class="mb-1 flex items-start justify-between">
										<h3
											class="mr-2 flex flex-1 items-center gap-2 text-sm font-medium leading-tight text-gray-900"
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
										<span class="rounded-md bg-white/50 px-2 py-1 font-mono backdrop-blur-sm">
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
