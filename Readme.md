Instruções

1. Ao terminar de gravar a tela do video, salvar o arquivo de vídeo em alguma pasta do projeto, sem usar a janela de salvar como do sistema. Apos isto já colocar na lista de videos disponiveis para uso

2. Usar o vuejs, pode ser de cdn para manipulação dos dados

3. na parte do rodape e direita colocar timeline e previa do video, como ser fosse o premiere, ver nesse exemplo: https://dribbble.com/shots/23872038-mecil-AI-Video-Generator

4. a timeline podera incluir varios videos na sequencia, estudar arrasta o video para o final da timeline, ou simplismente clicar no video e aparece um menu com o texto "Usar este vídeo"

5. Prévia, nao ha necessidade de colocar o nome do arquivo, apenas a duração conforme imagem do exemplo

6. Na timeline, estudar a opção de cortar o vídeo, trabalhar bem a questao das instancias de cada video, por exemplo, para cada video adicionado na timeline, ele sera uma instancia de um objeto, com propriedades por exemplo de inicio e fim(corte por exemplo). e cada instancia deve estar dentro de um array final, que no caso é o video todo

7. preparar a classe e converter os dados para a linguagem da biblioteca fluent-ffmeeg


-----------------------------------------------------------------------------------------------------


8 P2 . O preview precisa renderizar somente quando adicionar novos videos, inves de videos ressultantes 

9 P2. sobre a extresão te audio, é converter o video para mp3 e mutar o video original.

10 P3. as imagens vão ficar nos video, não vai ser sobrepostas (devinir tempo minimo), e depois ter a possibilidade de "esticar" a imagem na timeline, aumentando o tempo dela no preview.

11 P 1.5 . sobre o corte do video, é colocar a agulha na linha do tempo e selecionar o cortar para dividir o video

12 P3. quando importar, copiar o video para dentro da pastas projetos. Sugestão de separar os video em mais qualidade e menos (preview).

13 P2. Fazer o texto aparecer na timeline depois de salvo

13-2 P3 . Tirar o editor de texto e fazer estilo o "texto dos stories do intagram". Simplificar as funções de acordo com o ffmemp.

    Sugestões: Padrões(texto branco no fundo preto e vice-versa)
                Alterar Fonte, tanto em tipo do texto quanto tamanho. exmp. Arial, comic sans, e outra

                Colocar acima do video da timne
                Mesma ideia da imagen, "esticar" para controlar o tempo dele de tela.

14. Pesquisar API's modernas

15 P1.5 Para cada projeto salvar numa pasta separada, todos os arquivos gravados ou adicionados vão ser copiados para essa pastas e nessa pasta tambem vai ter o arquivo de configuração

16 P1. Para a função desfazer, foi sugerido a função:

            class TimeLine() {
    this.items.video = [
        new Video({
            file: '',
            start: 0,
            end: 10
        }),
        new Video({
            file: '',
            start: 0,
            end: 10
        }),
    ]
}

const historicoEv = [
    {
        acao: classe.addVideo(video),
        reversao: classe.removideo(video)
    },
    {
        data: {

        },
        acao: classe.recortarVideo(video, params),
        reversao: classe.desfazerRecortar(video)
    },
]

17 P1. Fazer com que o preview  acompanhe a agulho da timeline. e quando for cortar a agulha vai ser usado de parametro. Sugestão Debounce.

18 P2. Possibilidade de mover as midias dentro da timeline. dentro da sua layer

19 P1. Re-codificar toda a timeline, refazando suas estrutura assim acelerando o carregamento do sistema.
            Imagens na mesma layer que o video
            Texto numa layer acima porem menor
            audio continua separado

