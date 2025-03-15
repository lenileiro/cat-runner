defmodule GameWeb.GameLive do
  use GameWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, score: 0, game_state: :idle)}
  end

  def render(assigns) do
    ~H"""
    <script>
      // Direct JavaScript for debugging
      window.addEventListener('load', function() {
        console.log("Page loaded");
        // Add click handlers to canvas and button directly
        setTimeout(function() {
          const canvas = document.getElementById('gameCanvas');

          if (canvas) {
            console.log("Canvas found");
            canvas.addEventListener('click', function() {
              console.log("Canvas clicked directly from inline script");
            });
          }
        }, 1000);
      });
    </script>
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

      /* Game container (now without header) */
      .game-container {
        height: 100vh;
        width: 100%;
        display: block;
      }

      /* Canvas should fill the entire container */
      #gameCanvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>

    <div class="game-container">
      <canvas id="gameCanvas" phx-hook="GameCanvas" phx-click="canvas_start" data-state={@game_state}>
        Your browser does not support the canvas element.
      </canvas>
    </div>
    """
  end

  def handle_event("start_game", _, socket) do
    if socket.assigns.game_state != :playing do
      IO.puts("Server: Start game event received")

      {:noreply,
       socket |> assign(score: 0, game_state: :playing) |> push_event("start_game", %{})}
    else
      {:noreply, socket}
    end
  end

  def handle_event("jump", _, socket) do
    if socket.assigns.game_state == :playing do
      IO.puts("Server: Jump event received")
      {:noreply, push_event(socket, "jump", %{})}
    else
      {:noreply, socket}
    end
  end

  def handle_event("score_update", %{"score" => new_score}, socket) do
    {:noreply, assign(socket, score: new_score)}
  end

  def handle_event("game_over", _, socket) do
    IO.puts("Server: Game over event received")
    {:noreply, assign(socket, game_state: :game_over)}
  end

  def handle_event("canvas_start", _, socket) do
    if socket.assigns.game_state != :playing do
      IO.puts("Server: Canvas start event received")

      {:noreply,
       socket |> assign(score: 0, game_state: :playing) |> push_event("start_game", %{})}
    else
      {:noreply, socket}
    end
  end
end
