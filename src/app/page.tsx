import styles from './home.module.css';

// Landing deslogada — réplica do not-loggedin-header original (logo grande com
// gradientes + imagem da Estátua da Liberdade). Destino do "Sair".
export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <div className={styles.logoLine}>
            <span className={styles.gradedText}>Graded</span>&nbsp;
            <span className={styles.readersText}>Readers</span>
          </div>
          <span className={styles.byMv}>
            by
            <br />
            Mairo Vergara
          </span>
        </div>
      </header>
      <main className={styles.hero}>
        <h1 className={styles.heroTitle}>Aprenda inglês lendo histórias</h1>
        <p className={styles.heroText}>
          Leitura graduada com tradução frase a frase, dicas palavra a palavra e
          narração — do nível 1 ao 7.
        </p>
        <a className={styles.enterBtn} href="/library">
          Entrar na Biblioteca
        </a>
      </main>
    </div>
  );
}
