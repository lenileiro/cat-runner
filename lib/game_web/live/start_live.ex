defmodule GameWeb.StartLive do
  use GameWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, high_score: 0)}
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
      .start-container {
        height: 100vh;
        width: 100%;
        display: block;
      }

      /* Canvas should fill the entire container */
      #startCanvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>

    <div class="start-container">
      <canvas id="startCanvas" phx-hook="StartScreen">
        Your browser does not support the canvas element.
      </canvas>
    </div>
    """
  end
end
