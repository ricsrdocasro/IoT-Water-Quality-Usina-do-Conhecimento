// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB8jv5-6xvYwQ8m2xJYl8H1xF8m8t8t8t8",
    authDomain: "iot-water-quality.firebaseapp.com",
    databaseURL: "https://iot-water-quality-default-rtdb.firebaseio.com/",
    projectId: "iot-water-quality",
    storageBucket: "iot-water-quality.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let dadosOriginais = [];
let grafico = null;

// 🔵 Filtrar por intervalo rápido ou personalizado
function filtrarDados(dados) {
    let horas = parseInt(document.getElementById("intervalo").value);

    const personalizado = document.getElementById("intervaloPersonalizado").value;
    if (personalizado && personalizado > 0) {
        horas = parseInt(personalizado);
    }

    if (horas === 0) return dados;

    const agora = new Date();
    const limite = new Date(agora.getTime() - horas * 60 * 60 * 1000);

    return dados.filter(item => new Date(item.timestamp) >= limite);
}

// 🔵 Montar tabela
function renderizarTabela(dados) {
    const tabela = document.querySelector("#data-table tbody");
    tabela.innerHTML = "";

    dados.forEach(item => {
        const row = `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.ph}</td>
                <td>${item.turbidez}</td>
                <td>${item.temperatura} °C</td>
            </tr>
        `;
        tabela.innerHTML += row;
    });
}

// 🔵 Criar gráfico comparativo
function renderizarGrafico(dados) {
    const ctx = document.getElementById("grafico").getContext("2d");

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: "line",
        data: {
            labels: dados.map(d => new Date(d.timestamp).toLocaleString()),
            datasets: [
                {
                    label: "pH",
                    data: dados.map(d => d.ph),
                    borderColor: "blue",
                    fill: false
                },
                {
                    label: "Turbidez",
                    data: dados.map(d => d.turbidez),
                    borderColor: "green",
                    fill: false
                },
                {
                    label: "Temperatura (°C)",
                    data: dados.map(d => d.temperatura),
                    borderColor: "red",
                    fill: false
                }
            ]
        }
    });
}

// 🔵 Exportar CSV
function exportarCSV(dados, nomeArquivo) {
    let csv = "timestamp,ph,turbidez,temperatura\n";

    dados.forEach(item => {
        csv += `${item.timestamp},${item.ph},${item.turbidez},${item.temperatura}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
}

// 🔵 Carregar dados do Firebase
function carregarDados() {
    database.ref("leituras").once("value", snapshot => {
        dadosOriginais = [];

        snapshot.forEach(child => {
            dadosOriginais.push(child.val());
        });

        atualizarExibicao();
    });
}

// 🔵 Atualizar tabela + gráfico
function atualizarExibicao() {
    const filtrados = filtrarDados(dadosOriginais);

    filtrados.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    renderizarTabela(filtrados);
    renderizarGrafico(filtrados);
}

// 🔵 Eventos
document.getElementById("intervalo").addEventListener("change", () => {
    document.getElementById("intervaloPersonalizado").value = "";
    atualizarExibicao();
});

document.getElementById("btnAplicarPersonalizado").addEventListener("click", atualizarExibicao);

document.getElementById("btnExportarFiltrado").addEventListener("click", () => {
    const filtrados = filtrarDados(dadosOriginais);
    exportarCSV(filtrados, "dados_filtrados.csv");
});

document.getElementById("btnExportarCompleto").addEventListener("click", () => {
    exportarCSV(dadosOriginais, "dados_completos.csv");
});

// 🔵 Inicializar
carregarDados();