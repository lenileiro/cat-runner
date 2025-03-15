defmodule GameWeb.GamePlayLive do
  use GameWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, score: 0, game_state: :idle, high_score: get_high_score())}
  end

  def render(assigns) do
    ~H"""
    <style>
      /* Reset page styles */
      body, html {
        margin: 0;
        padding: 0;
        overflow: hidden;
        height: 100%;
      }

      /* Remove Phoenix navigation */
      .app-nav, nav.bg-brand, header.bg-brand, .phx-hero,
      nav[role="navigation"], header[role="banner"], footer[role="contentinfo"] {
        display: none !important;
      }

      /* Ensure the Phoenix layout doesn't interfere */
      .container, main, #mainContent, body > div {
        padding: 0 !important;
        margin: 0 !important;
        max-width: none !important;
        width: 100% !important;
      }

      /* Full-screen container */
      .game-container {
        height: 100vh;
        width: 100%;
        display: block;
        position: relative;
      }

      /* Canvas should fill the entire container */
      #gameCanvas {
        display: block;
        width: 100%;
        height: 100%;
        touch-action: manipulation; /* Prevents zoom on double-tap on mobile */
      }

      /* Game UI Overlay */
      .game-ui {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        pointer-events: none; /* Allow clicks to pass through to canvas */
      }

      .game-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
      }

      .pause-button {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        pointer-events: auto; /* Make button clickable */
      }
    </style>

    <div class="game-container">
      <canvas id="gameCanvas" phx-hook="GameCanvas" data-state={@game_state} phx-update="ignore">
        Your browser does not support the canvas element.
      </canvas>

      <!-- Remove or comment out this div that contains the header overlay -->
      <!-- <div class="game-ui">
        <div class="game-header">
          <div class="score">Score: <%= @score %></div>
          <div class="high-score">High Score: <%= @high_score %></div>
          <button class="pause-button" phx-click="toggle_pause">⏸️</button>
        </div>
      </div> -->
    </div>
    """
  end

  def handle_event("toggle_pause", _, %{assigns: %{game_state: :playing}} = socket) do
    {:noreply, socket |> assign(game_state: :paused) |> push_event("pause_game", %{})}
  end

  def handle_event("toggle_pause", _, %{assigns: %{game_state: :paused}} = socket) do
    {:noreply, socket |> assign(game_state: :playing) |> push_event("resume_game", %{})}
  end

  def handle_event("toggle_pause", _, socket) do
    {:noreply, socket}
  end

  def handle_event("game_start", _, socket) do
    {:noreply, socket |> assign(score: 0, game_state: :playing) |> push_event("start_game", %{})}
  end

  def handle_event("jump", _, %{assigns: %{game_state: :playing}} = socket) do
    {:noreply, push_event(socket, "jump", %{})}
  end

  def handle_event("score_update", %{"score" => new_score}, socket) do
    {:noreply, assign(socket, score: new_score)}
  end

  def handle_event("game_over", %{"score" => final_score}, socket) do
    high_score = max(socket.assigns.high_score, final_score)

    {:noreply, socket
    |> assign(game_state: :game_over, score: final_score, high_score: high_score)
    |> push_event("update_high_score", %{high_score: high_score})}
  end

  # Helper to get high score - in a real app, this might come from a database
  defp get_high_score do
    # For now, we'll just return 0 and let the JavaScript handle the localStorage
    0
  end
end
