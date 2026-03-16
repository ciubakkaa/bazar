<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { createClient } from '$lib/supabase';
	import MessageBubble from '$lib/components/MessageBubble.svelte';

	let { data } = $props();

	const supabase = createClient();
	const userId = data.user?.id;
	const conversationId = data.conversation?.id;
	const isGroupChat = data.conversation?.type === 'faculty';

	let messages = $state([...(data.messages ?? [])]);
	let messageText = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();
	let sending = $state(false);

	// Build a lookup map for member names
	const memberNames = $derived(
		Object.fromEntries(
			(data.members ?? []).map((m: any) => [m.profile_id, m.profile?.full_name ?? 'Utilizator'])
		)
	);

	// Conversation display name
	const conversationName = $derived.by(() => {
		if (data.conversation?.type === 'faculty' && data.conversation?.name) {
			return data.conversation.name;
		}
		const other = data.members?.find((m: any) => m.profile_id !== userId);
		return other?.profile?.full_name ?? 'Conversatie';
	});

	// Auto-scroll to bottom
	async function scrollToBottom() {
		await tick();
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	// Scroll on initial load
	$effect(() => {
		if (messages.length) {
			scrollToBottom();
		}
	});

	// Realtime subscription
	const channel = conversationId
		? supabase
				.channel(`chat-${conversationId}`)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'messages',
						filter: `conversation_id=eq.${conversationId}`
					},
					(payload) => {
						// Avoid duplicating messages we just sent
						const newMsg = payload.new as any;
						if (!messages.find((m: any) => m.id === newMsg.id)) {
							messages = [...messages, newMsg];
							scrollToBottom();
						}
					}
				)
				.subscribe()
		: null;

	onDestroy(() => {
		if (channel) {
			supabase.removeChannel(channel);
		}
	});

	async function sendMessage() {
		const text = messageText.trim();
		if (!text || sending) return;

		sending = true;
		messageText = '';

		const { data: newMsg, error } = await supabase
			.from('messages')
			.insert({
				conversation_id: conversationId,
				sender_id: userId,
				content: text
			})
			.select()
			.single();

		if (newMsg && !messages.find((m: any) => m.id === newMsg.id)) {
			messages = [...messages, newMsg];
			scrollToBottom();
		}

		if (error) {
			console.error('Failed to send message:', error);
			messageText = text; // restore on error
		}

		sending = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-3xl mx-auto">
	<!-- Header -->
	<div
		class="flex items-center gap-3 px-4 py-3 bg-white border-b border-bazar-gray-100 shrink-0"
	>
		<a
			href="/messages"
			class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bazar-gray-100 transition-colors"
		>
			<svg class="w-5 h-5 text-bazar-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
		</a>
		<div class="min-w-0">
			<h1 class="font-semibold text-bazar-dark truncate">{conversationName}</h1>
			{#if isGroupChat}
				<p class="text-xs text-bazar-gray-500">
					{data.members?.length ?? 0} membri
				</p>
			{/if}
		</div>
	</div>

	<!-- Messages -->
	<div
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-bazar-offwhite"
	>
		{#if messages.length === 0}
			<div class="flex items-center justify-center h-full">
				<p class="text-bazar-gray-500 text-sm">Niciun mesaj inca. Spune salut!</p>
			</div>
		{:else}
			{#each messages as msg (msg.id)}
				<MessageBubble
					content={msg.content}
					sender_name={msg.sender_id ? memberNames[msg.sender_id] ?? 'Utilizator' : 'Utilizator'}
					is_mine={msg.sender_id === userId}
					timestamp={msg.created_at ?? ''}
					show_sender={isGroupChat}
				/>
			{/each}
		{/if}
	</div>

	<!-- Input area -->
	<div class="shrink-0 bg-white border-t border-bazar-gray-100 px-4 py-3">
		{#if data.isVerified}
			<div class="flex items-end gap-2">
				<textarea
					bind:value={messageText}
					onkeydown={handleKeydown}
					placeholder="Scrie un mesaj..."
					rows="1"
					class="flex-1 resize-none rounded-bazar-sm border-2 border-bazar-gray-200 px-3 py-2 text-[15px] text-bazar-dark placeholder:text-bazar-gray-500 focus:border-bazar-dark focus:outline-none transition-colors"
				></textarea>
				<button
					onclick={sendMessage}
					disabled={!messageText.trim() || sending}
					class="w-10 h-10 flex items-center justify-center rounded-full bg-bazar-dark text-white shrink-0 hover:bg-bazar-dark/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 19V5m0 0l-7 7m7-7l7 7"
							transform="rotate(45 12 12)"
						/>
					</svg>
				</button>
			</div>
		{:else}
			<div
				class="text-center py-3 px-4 bg-amber-50 border border-amber-200 rounded-bazar-sm text-sm text-amber-800"
			>
				<a href="/profile" class="underline hover:no-underline">Verifica-te</a> pentru a trimite mesaje.
			</div>
		{/if}
	</div>
</div>
