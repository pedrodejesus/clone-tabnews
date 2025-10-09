function Home() {
  const asciiArt = String.raw`
 _____________________________
(   Nós vamos ficar ricos!!!   )
 -----------------------------
      o    ^__^
        o  (oo)\_______
          (__)\        )\/\
              ||----w||
              ||     ||
`;

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <pre
        style={{
          fontFamily: "monospace",
          fontSize: "16px",
          whiteSpace: "pre",
          display: "inline-block",
          textAlign: "left",
        }}
      >
        {asciiArt}
      </pre>
    </div>
  );
}

export default Home;
