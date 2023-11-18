import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, ViewChild } from '@angular/core';
import { CanvasOption } from './models/itens-select-click.model';

@Component({
  selector: 'uni-canvas-multiples-lines',
  templateUrl: './canvas-multiple-lines.component.html',
  styleUrls: ['./canvas-multiple-lines.component.scss']
})
export class CanvasMultipleLinesComponent implements OnInit, AfterViewInit, OnChanges {

  /**@description Canvas reference */
  @ViewChild('canvasEl') canvasElement: ElementRef;

  @ViewChild('snackbar', { static: false }) snackbar

  /**@description Canvas context */
  private ctx: CanvasRenderingContext2D

  /**@description Receives an array with options */
  @Input() objArray_Options: Array<CanvasOption> = []

  /**@description Array that will contain the clicked coordinates information */
  @Input() objArray_Lines: Array<any> = []

  /**@description Receives the index indicating which line we are currently working on */
  nr_Index_Array_Lines: number = 0

  /**@description Margin of error when clicking on a column */
  @Input() nr_Margin_Of_Error_Click_Column: number = 10

  /**@description Total width of the canvas */
  @Input() nr_Canvas_Width

  /**@description Total height of the canvas */
  @Input() nr_Canvas_Height

  /**@description Interval between values on the X axis */
  @Input() nr_Interval_Axis_X

  /**@description Interval between values on the Y axis */
  @Input() nr_Interval_Axis_Y

  /**@description Minimum value on the X axis */
  nr_Min_Value_Cartesian_X = 0

  /**@description Maximum value on the X axis (+ this.nr_Interval to remove the last value from the canvas border) */
  @Input() nr_Max_Value_Cartesian_X: number

  /**@description Minimum value on the Y axis (- (this.nr_Interval * 2) so that the first value appears higher on the Y axis) */
  nr_Min_Value_Cartesian_Y: number

  /**@description Maximum value on the Y axis (+ this.nr_Interval to remove the last value from the canvas border) */
  @Input() nr_Max_Value_Cartesian_Y: number

  /**@description The value to be added to the maximum value on the X axis (e.g., 10 by 10, 5 by 5...) */
  @Input() nr_Value_Add_Max_X: number

  /**@description Used to define the maximum value of the canvas container on the screen */
  nr_Max_Width_Container: number

  /**@description Used to control the display of horizontal lines (X axis) */
  b_Show_Lines_Axis_X: boolean = false

  /**@description Used to control the display of vertical lines values (Y axis) */
  @Input() b_Show_Values_Lines_Axis_Y: boolean = true

  /**@description This is the multiplier value to make the canvas width dynamic according to the maximum value on the X axis */
  @Input() nr_Value_Multiplier

  /**@description Object used to compose the CSS of the modal that appears next to the mouse cursor */
  Modal_Cursor_Style: any = {
    display: 'none',
  };

  /**@description Receives the value of the column that will be displayed in the modal next to the cursor */
  nr_Value_Column_Modal: number

  /**@description Receives the value of the line that will be displayed in the modal next to the cursor */
  nr_Value_Line_Modal: number

  /**@description Emits an object with the information of the point added in the Cartesian plane */
  @Output() onEvent_Inserted = new EventEmitter()

  /**@description Emits an object with the information of the point changed in the Cartesian plane */
  @Output() onEvent_Updated = new EventEmitter()

  /**@description Emits an object with the information of the point deleted in the Cartesian plane */
  @Output() onEvent_Deleted = new EventEmitter()

  /**@description Receives the text that will appear to alert the user */
  @Input() nm_Text_Alert: string

  /**@description Receives true when the component is disabled and should not perform markings */
  @Input() b_Canvas_Disabled: boolean = false

  constructor() { }

  /**@description Ajustes de dimensionamento */
  ngOnInit(): void {

    this.nr_Max_Value_Cartesian_X = this.nr_Max_Value_Cartesian_X + this.nr_Interval_Axis_X

    this.nr_Min_Value_Cartesian_Y = this.nr_Interval_Axis_Y - (this.nr_Interval_Axis_Y * 2)

    this.nr_Max_Value_Cartesian_Y = this.nr_Max_Value_Cartesian_Y + (-this.nr_Min_Value_Cartesian_Y)

    this.nr_Max_Width_Container = this.nr_Max_Value_Cartesian_X * this.nr_Value_Multiplier
  }

  ngAfterViewInit(): void {

    this.Set_Size_Canvas(true)

    this.ctx = this.canvasElement.nativeElement.getContext('2d');
    this.Set_Draw_Cartesian_Plane();

    this.canvasElement.nativeElement.addEventListener('click', (event) => {
      this.Set_Handle_Canvas_Click(event);
    });

    this.canvasElement.nativeElement.addEventListener('mousemove', (event) => {
      if (this.b_Show_Lines_Axis_X) {
        this.Set_Show_Modal_Aside_Mouse(event)
      }
    })

    //Esconde o modal do cursor quando o usuário sai do canvas
    this.canvasElement.nativeElement.addEventListener('mouseleave', () => {
      this.Modal_Cursor_Style = {
        display: 'none'
      }
    })
  }

  ngOnChanges(changes) {
    if (changes["nr_Max_Value_Cartesian_X"]?.currentValue != changes['nr_Max_Value_Cartesian_X']?.previousValue) {

      this.Set_Size_Canvas(false)
    }

    this.Set_Drawing_Icones_SVG()
    this.Set_Conect_Points()
  }

  /**@description Usada para exibir o modal ao lado do cursor do mouse, mostrando as coordenadas */
  Set_Show_Modal_Aside_Mouse(event: MouseEvent) {

    const nr_Canvas_X = event.offsetX;
    const nr_Canvas_Y = event.offsetY;

    this.nr_Value_Column_Modal = Math.trunc(this.Set_Canvas_To_Cartesian_Plane_X(nr_Canvas_X));
    this.nr_Value_Line_Modal = Math.trunc(this.Set_Canvas_To_Cartesian_Plane_Y(nr_Canvas_Y))

    this.Set_Build_Modal_Cursor(event)
  }

  /**@description Usada para criar o modal que fica ao lodo do cursor indicando as posições */
  Set_Build_Modal_Cursor(event: MouseEvent) {
    this.Modal_Cursor_Style = {
      display: 'block',
      position: 'absolute',
      'font-size': '0.9rem',
      'background-color': "#C4CBCF",
      height: '4.5rem',
      'font-weight': '600',
      width: '7rem',
      'padding-left': '0.5rem',
      'box-shadow:': '0 0 8px rgba(0, 0, 0, 0.28)',
      'border-radius': '0.2rem',
      left: this.Set_Postion_Modal_Mouse_Axis_X(event) + 'px',
      top: this.Set_Postion_Modal_Mouse_Axis_Y(event) + 'px',
    };
  }

  /**@description Usada para ajustar a posição do modal no eixo X */
  Set_Postion_Modal_Mouse_Axis_X(event: MouseEvent): number {
    if (event.clientX + 150 > this.nr_Max_Width_Container)
      return event.offsetX - 130
    else
      return event.offsetX + 20
  }

  /**@description Usada para ajustar a posição do modal no eixo Y */
  Set_Postion_Modal_Mouse_Axis_Y(event: MouseEvent): number {
    if (event.clientY > this.nr_Canvas_Height)
      return event.offsetY - 65
    else
      return event.offsetY + 15
  }

  /**@description Configura as dimensões do canvas dinamicamente */
  Set_Size_Canvas(b_Write_Value: boolean) {
    if (this.canvasElement) {

      this.canvasElement.nativeElement.width = this.nr_Max_Value_Cartesian_X * this.nr_Value_Multiplier
      this.nr_Canvas_Width = this.canvasElement.nativeElement.width
      this.canvasElement.nativeElement.height = this.nr_Canvas_Height

      if (b_Write_Value) {
        this.nr_Max_Width_Container = this.nr_Canvas_Width
      }
    }
  }

  /**@description Configura as dimensões do canvas dinâmicamente */
  Set_Add_Value_Axis_X() {
    if (!this.b_Canvas_Disabled) {
      this.nr_Max_Value_Cartesian_X = this.nr_Max_Value_Cartesian_X + this.nr_Value_Add_Max_X

      this.Set_Size_Canvas(false)
      this.Set_Draw_Cartesian_Plane(this.b_Show_Lines_Axis_X)
      this.Set_Drawing_Icones_SVG()
      this.Set_Conect_Points()
    }
  }

  /**Remove a última marcação do item que estiver selecionado e emite um evento */
  Set_Undo_Last_Point() {
    if (this.objArray_Lines[this.nr_Index_Array_Lines].length >= 1) {

      let objDeleted = this.objArray_Lines[this.nr_Index_Array_Lines].splice(this.objArray_Lines[this.nr_Index_Array_Lines].length - 1, 1)[0]

      this.onEvent_Deleted.emit({ nr_Index_Iten: objDeleted.nr_Index_Iten })
    }
  }

  /**@description Prepara e manda criar as linhas do plano cartesiano */
  Set_Draw_Cartesian_Plane(b_Draw_Line_X: boolean = false): void {

    this.ctx.fillStyle = 'white';

    this.ctx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);

    //linhas horizontais
    for (let y = this.nr_Min_Value_Cartesian_Y; y <= this.nr_Max_Value_Cartesian_Y - this.nr_Interval_Axis_Y; y += this.nr_Interval_Axis_Y) {
      this.Set_Draw_Line_X(0, this.yToCanvas(y), this.nr_Canvas_Width, y.toString(), b_Draw_Line_X);
    }

    // linhas verticais
    for (let x = this.nr_Min_Value_Cartesian_X; x <= this.nr_Max_Value_Cartesian_X - this.nr_Interval_Axis_X; x += this.nr_Interval_Axis_X) {
      this.Set_Draw_Line_Y(this.xToCanvas(x), 0, this.xToCanvas(x), this.nr_Canvas_Height, x.toString());
    }
  }

  /**@description Desenha as linha horizontais */
  Set_Draw_Line_X(x1: number, y: number, x2: number, text: string, b_Draw_Line: boolean): void {

    //Esse valor que é somando com o 'x' é para não deixar a linha passar por cima do número
    const nr_Value_Magin = 32

    this.ctx.strokeStyle = b_Draw_Line && Number(text) > 0 ? '#5B5C65' : 'white'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.moveTo(x1 + nr_Value_Magin, y)
    this.ctx.lineTo(x2 + nr_Value_Magin, y)
    this.ctx.stroke()

    if (Number(text) > 0 && this.b_Show_Values_Lines_Axis_Y) {
      this.ctx.fillStyle = 'black'
      this.ctx.font = '12px Arial'
      this.ctx.fillText(text, x1 + 4, y + 4)
    }
  }

  /**@description Desenha as linha verticais */
  Set_Draw_Line_Y(x1: number, y1: number, x2: number, y2: number, text: string) {

    //Esse valor que é subtraído com o 'y' é para não deixar a linha passar por cima do número
    const nr_Value_Magin = 20

    if (x1 && x2 > 0) {

      this.ctx.strokeStyle = '#5B5C65'
      this.ctx.lineWidth = 3.5
      this.ctx.beginPath()
      this.ctx.moveTo(x1, y1 - nr_Value_Magin)
      this.ctx.lineTo(x2, y2 - nr_Value_Magin)
      this.ctx.stroke()

      if (Number(text) > 0) {
        this.ctx.fillStyle = 'black'
        this.ctx.font = '12px Arial'
        this.ctx.fillText(text, x1 - 6, this.nr_Canvas_Height - 3)
      }
    }
  }

  /**@description Usada para exibir ou não as linhas horizontais */
  onClick_Draw_Grid_Line_X() {
    this.b_Show_Lines_Axis_X = !this.b_Show_Lines_Axis_X
    this.Set_Draw_Cartesian_Plane(this.b_Show_Lines_Axis_X)
    this.Set_Drawing_Icones_SVG()
    this.Set_Conect_Points()
  }

  /**@description Usada para mapear valores do eixo X do plano cartesiano para coordenadas verticais dentro do elemento <canvas>, Ajuste de escala */
  xToCanvas(x: number): number {
    return Math.ceil(((x - this.nr_Min_Value_Cartesian_X) / (this.nr_Max_Value_Cartesian_X - this.nr_Min_Value_Cartesian_X)) * this.nr_Canvas_Width);
  }

  /**@description Usada para mapear valores do eixo Y do plano cartesiano para coordenadas verticais dentro do elemento <canvas>, Ajuste de escala */
  yToCanvas(y: number): number {
    return Math.ceil(this.nr_Canvas_Height - ((y - this.nr_Min_Value_Cartesian_Y) / (this.nr_Max_Value_Cartesian_Y - this.nr_Min_Value_Cartesian_Y)) * this.nr_Canvas_Height);
  }

  /**@description Lida com a ação de clique no canvas*/
  Set_Handle_Canvas_Click(event: MouseEvent): void {

    if (!this.b_Canvas_Disabled) {

      // Obtém as coordenadas do clique dentro do canvas
      const nr_Canvas_X = event.offsetX;
      const nr_Canvas_Y = event.offsetY;
      const nr_Value_Cartesian_X = this.Set_Canvas_To_Cartesian_Plane_X(nr_Canvas_X);
      const nr_Value_Cartesian_Y = this.Set_Canvas_To_Cartesian_Plane_Y(nr_Canvas_Y);

      //Não deixa que o clique seja nas bordas do canvas
      if (this.Set_Verify_Click_Out_Of_Cartesian(Math.trunc(nr_Value_Cartesian_X), Math.trunc(nr_Value_Cartesian_Y))) {
        // Verifica se o clique está dentro de uma coluna ou em um espaço em branco
        for (let i = this.nr_Min_Value_Cartesian_X; i <= this.nr_Max_Value_Cartesian_X; i += this.nr_Interval_Axis_X) {

          const xCenter = this.xToCanvas(i)

          if (Math.abs(xCenter - nr_Canvas_X) <= this.nr_Margin_Of_Error_Click_Column) {

            const rect = this.canvasElement.nativeElement.getBoundingClientRect();
            const nr_Position_X = event.clientX - rect.left;
            const nr_Position_Y = event.clientY - rect.top;

            if (this.objArray_Options.length != 0) {

              // Se antender a validação é por que, quando o componente se inicializou não tinha nenhum item no objArray_Options porém agora o usuário já adicionou
              if (this.objArray_Lines.length != this.objArray_Options.length) {
                this.objArray_Lines = [...this.objArray_Lines, []]
              }

              this.Set_Handle_Click_Column(nr_Position_X, nr_Position_Y, Math.trunc(nr_Value_Cartesian_X), Math.trunc(nr_Value_Cartesian_Y))
            } else
              this.snackbar.timer(this.nm_Text_Alert, 4000)

            break
          }
        }
      } else {
        this.snackbar.timer("Por favor clique em uma coluna")
      }
    }
  }

  /**@description Valida os cliques no canvas e executa as devidas ações */
  Set_Handle_Click_Column(nr_Position_X: number, nr_Position_Y: number, nr_Value_Click_X: number, nr_Value_Click_Y: number) {

    let b_Previous_Click_Out_Of_Column: boolean = false
    let obj_Item_Previous: any
    var objLast_Same_Coordinate: any
    let nr_Index: number = 0

    if (this.objArray_Lines[this.nr_Index_Array_Lines].length > 0) {

      const array = this.objArray_Lines[this.nr_Index_Array_Lines];

      for (let i = 0; i < array.length; i++) {

        if (this.xToCanvas(array[i].nr_Position_X) + this.nr_Margin_Of_Error_Click_Column > nr_Position_X && this.xToCanvas(array[i].nr_Position_X) - this.nr_Margin_Of_Error_Click_Column < nr_Position_X) {

          objLast_Same_Coordinate = array[i];
          nr_Index = i
          break
        }
      }
    }

    //Verifica se o clique atual é uma mesma coluna anterior
    if (objLast_Same_Coordinate) {
      obj_Item_Previous = this.objArray_Lines[this.nr_Index_Array_Lines].splice(nr_Index, 1)[0]
      //this.Set_Insert_Item_Same_Position(nr_Position_X, nr_Position_Y, nr_Value_Click_X, nr_Value_Click_Y, nr_Index)
      this.onEvent_Updated.emit({ nr_Duracao: nr_Value_Click_X, vl_Usado: nr_Value_Click_Y, cd_Option: this.objArray_Options.find(iten => iten.b_Selected)?.cd_Option, nr_Index_Iten: obj_Item_Previous.nr_Index_Iten })
    }

    b_Previous_Click_Out_Of_Column = this.Set_Verify_Invalid_Previous_Click(nr_Position_X)

    if (!b_Previous_Click_Out_Of_Column || objLast_Same_Coordinate) {

      const nm_Path_SVG = this.objArray_Options.find(iten => iten.b_Selected)?.nm_Path_SVG
      const nm_Hash_Color = this.objArray_Options.find(iten => iten.b_Selected)?.nm_Hash_Color

      if (!b_Previous_Click_Out_Of_Column) {
        this.objArray_Lines[this.nr_Index_Array_Lines].push({ nr_Position_X, nr_Position_Y, nm_Path_SVG, nm_Hash_Color, nr_Value_Click_X, nr_Value_Click_Y })
      }

      this.Set_Remove_Itens_Same_Column(nr_Position_X)

      if (!objLast_Same_Coordinate && !b_Previous_Click_Out_Of_Column) {
        this.onEvent_Inserted.emit({ nr_Duracao: nr_Value_Click_X, vl_Usado: nr_Value_Click_Y, cd_Option: this.objArray_Options.find(iten => iten.b_Selected)?.cd_Option })
      }
    }
  }

  /**@description Remove os items anteriores de uma mesma coluna permanecendo apenas o mais recente */
  Set_Remove_Itens_Same_Column(nr_Position_X: number) {

    const array = this.objArray_Lines[this.nr_Index_Array_Lines];

    // Filtra os pontos na mesma coluna com margem de erro
    const sameColumnPoints = array.filter(item =>
      Math.abs(item.nr_Position_X - nr_Position_X) <= this.nr_Margin_Of_Error_Click_Column
    );

    // Remove todos os pontos na mesma coluna, exceto o mais recente
    if (sameColumnPoints.length > 1) {
      const mostRecentPoint = sameColumnPoints[sameColumnPoints.length - 1];

      // Remove todos os pontos na mesma coluna, exceto o mais recente
      this.objArray_Lines[this.nr_Index_Array_Lines] = array.filter(item =>
        Math.abs(item.nr_Position_X - nr_Position_X) > this.nr_Margin_Of_Error_Click_Column || item === mostRecentPoint
      );
    }
  }

  /**@description Insere um item em uma posição específica do array */
  Set_Insert_Item_Same_Position(nr_Position_X: number, nr_Position_Y: number, nr_Value_Click_X: number, nr_Value_Click_Y: number, nr_Index: any) {

    const nm_Path_SVG = this.objArray_Options.find(iten => iten.b_Selected)?.nm_Path_SVG
    const nm_Hash_Color = this.objArray_Options.find(iten => iten.b_Selected)?.nm_Hash_Color

    this.objArray_Lines[this.nr_Index_Array_Lines].splice(nr_Index, 0, {
      nr_Position_X: nr_Position_X,
      nr_Position_Y: nr_Position_Y,
      nm_Path_SVG: nm_Path_SVG,
      nm_Hash_Color: nm_Hash_Color,
      nr_Value_Click_X: nr_Value_Click_X,
      nr_Value_Click_Y: nr_Value_Click_Y,
      b_Teste: true
    })
  }

  /**@description Verifica se o clique atual é válido */
  Set_Verify_Invalid_Previous_Click(nr_Relative_Position_X: number): boolean {
    var objLast_Coordinate = this.objArray_Lines[this.nr_Index_Array_Lines].find(iten => this.xToCanvas(iten.nr_Position_X) > nr_Relative_Position_X)

    if (objLast_Coordinate)
      return true
    else
      return false
  }

  /**@description Verifica se o clique foi fora dos limites do plano cartesiano */
  Set_Verify_Click_Out_Of_Cartesian(nr_Value_Cartesian_X: number, nr_Value_Cartesian_Y: number) {
    let b_Click_Under_Min: boolean = false
    let b_Click_Above_Max_Y: boolean = false
    let b_Click_Above_Max_X: boolean = false

    // Verifica se o clique dentro dos intervalos dos eixos
    if (Math.round(nr_Value_Cartesian_X) >= this.nr_Interval_Axis_X && Math.round(nr_Value_Cartesian_Y) >= this.nr_Interval_Axis_Y) {
      b_Click_Under_Min = true
    }

    //Verifica se o usuário clicou em um ponto muito pra cima
    if (nr_Value_Cartesian_Y > this.nr_Max_Value_Cartesian_Y - this.nr_Interval_Axis_Y) {
      b_Click_Above_Max_Y = true
    }

    //Verifica se o usuário clicou em um ponto muito para a direita
    if (nr_Value_Cartesian_X > this.nr_Max_Value_Cartesian_X - this.nr_Interval_Axis_X) {
      b_Click_Above_Max_X = true
    }

    if (b_Click_Under_Min && !b_Click_Above_Max_Y && !b_Click_Above_Max_X)
      return true
    else
      return false
  }

  /**@description Converte as coordenadas do eixo X do canvas para valores do plano cartesiano */
  Set_Canvas_To_Cartesian_Plane_X(canvasX: number): number {
    return (
      (canvasX / this.nr_Canvas_Width) * (this.nr_Max_Value_Cartesian_X - this.nr_Min_Value_Cartesian_X) + this.nr_Min_Value_Cartesian_X
    );
  }

  /**@description Converte as coordenadas do eixo Y do canvas para valores do plano cartesiano */
  Set_Canvas_To_Cartesian_Plane_Y(canvasY: number): number {
    return (
      ((this.nr_Canvas_Height - canvasY) / this.nr_Canvas_Height) *
      (this.nr_Max_Value_Cartesian_Y - this.nr_Min_Value_Cartesian_Y) +
      this.nr_Min_Value_Cartesian_Y
    );
  }

  /**@description Acionado quando deseja-se iniciar ou continuar uma outra linha no cartesiano */
  onClick_Type_Line(iten: CanvasOption) {
    this.nr_Index_Array_Lines = iten.cd_Option - 1

    this.objArray_Options.find(iten => iten.b_Selected).b_Selected = false

    iten.b_Selected = true
  }

  /**@description Conecta os pontos no cartesiano */
  Set_Conect_Points() {

    if (!this.ctx || !this.canvasElement) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);
    this.Set_Draw_Cartesian_Plane(this.b_Show_Lines_Axis_X)

    for (let index = 0; index < this.objArray_Lines.length; index++) {
      const subarray = this.objArray_Lines[index]

      if (subarray.length < 2) {
        continue
      }

      const color = subarray[0].nm_Hash_Color;
      this.ctx.strokeStyle = color

      for (let i = 1; i < subarray.length; i++) {
        this.ctx.beginPath()
        this.ctx.moveTo(this.xToCanvas(subarray[i - 1].nr_Position_X), this.yToCanvas(subarray[i - 1].nr_Position_Y))
        this.ctx.lineTo(this.xToCanvas(subarray[i].nr_Position_X) + 2, this.yToCanvas(subarray[i].nr_Position_Y));
        this.ctx.stroke();
      }
    }
    this.ctx.stroke();
  }

  /**@description Insere o ícone na posição em que foi selecionado no canvas */
  Set_Drawing_Icones_SVG() {
    for (let index = 0; index < this.objArray_Lines.length; index++) {
      for (let i = 0; i < this.objArray_Lines[index].length; i++) {
        const img = new Image();
        img.src = this.objArray_Lines[index][i].nm_Path_SVG
        img.onload = () => {
          this.ctx.drawImage(img, this.xToCanvas(this.objArray_Lines[index][i].nr_Position_X - 0.7), this.yToCanvas(this.objArray_Lines[index][i].nr_Position_Y) - 8, 20, 20);
        }
      }
    }
  }
}
