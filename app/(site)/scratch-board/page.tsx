// /app/(site)/scratch-board/page.tsx

export default function ScratchBoardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">Scratch Board</h1>
      <p className="opacity-80">
        A showcase of Erik’s Scratch projects — coding fun explained in his own words.
      </p>

      {/* Example Scratch project */}
      <div className="card-block">
        <h2 className="font-mc text-lg mb-2">Dancing Cat</h2>
        <iframe
          src="https://scratch.mit.edu/projects/123456789/embed"
          allowFullScreen
          className="w-full h-64 border rounded"
        />
        <p className="text-sm mt-2">
          My first Scratch animation. Press the green flag to start!
        </p>
      </div>

      <div className="card-block">
        <h2 className="font-mc text-lg mb-2">Simple Platformer</h2>
        <iframe
          src="https://scratch.mit.edu/projects/987654321/embed"
          allowFullScreen
          className="w-full h-64 border rounded"
        />
        <p className="text-sm mt-2">
          Jump across platforms and avoid obstacles! Made with Scratch blocks.
        </p>
      </div>
    </div>
  );
}