import { useRef, useEffect } from "react";
import Phaser from "phaser";
import CharacterSelectScene from "../game/ui/scenes/CharacterSelectScene";
import { container, TYPES } from "../di";

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    // Get the Phaser.Game instance directly from the container
    const game = container.get<Phaser.Game>(TYPES.PhaserClient);

    // Set the parent element for the game
    game.canvas.parentNode?.removeChild(game.canvas);
    gameRef.current.appendChild(game.canvas);

    // Start the CharacterSelectScene
    game.scene.start("CharacterSelectScene");

    // Handle window resize
    const resize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);

      // Don't destroy the game on unmount since it's managed by the container
      // Just remove the scene if needed
      if (game.scene.getScene("CharacterSelectScene")) {
        game.scene.remove("CharacterSelectScene");
      }
    };
  }, []);

  return <div ref={gameRef} style={{ width: "100%", height: "100%" }} />;
}
