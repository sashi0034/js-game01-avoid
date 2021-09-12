var canvas;
var context;
var gameLoopTimer;
var curPosX = 0;
var curPosY = 0;
var mouseState = -1;
var hndl;

var gameState=0;
var gameScore=0;

const GAME_PLAYING=0;
const GAME_OVER=1;

const ROUGH_SCALE = 3;
const ROUGH_WIDTH = 416; 
const ROUGH_HEIGHT = 240;
const SCREEN_WIDTH = ROUGH_SCALE*ROUGH_WIDTH;
const SCREEN_HEIGHT = ROUGH_SCALE*ROUGH_HEIGHT;

const COL_FIRE = 1 << 0;

const img_bakugon=new Image();

window.onload = function() {
    canvas = document.getElementById("canvas1");
    if ( canvas.getContext ) {
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = this.checked;
        context.mozImageSmoothingEnabled = this.checked;
        context.webkitImageSmoothingEnabled = this.checked;
        context.msImageSmoothingEnabled = this.checked;

        Sprite.init();
        hndl = new Handler();

        gameLoopTimer = setInterval( function(){},16);
        SceneChage.toTitle();
        
        document.onmousemove = onMouseMove;   // マウス移動ハンドラ
        document.onmouseup = onMouseUp;       // マウスアップハンドラ
        document.onmousedown = onMouseDown;   // マウスダウンハンドラ
    }
}





function onMouseMove( e ) {
    curPosX = e.clientX;
    curPosY = e.clientY;
    let pos = clientToCanvas( canvas, curPosX, curPosY );
    curPosX = pos.x;
    curPosY = pos.y;
}

function onMouseDown( e ) {
    mouseState = e.button;
}

function onMouseUp( e ) {
    mouseState = -1;
}

function clientToCanvas(canvas, clientX, clientY) {
    let cx = clientX - canvas.offsetLeft + document.body.scrollLeft;
    let cy = clientY - canvas.offsetTop + document.body.scrollTop;
    //console.log(clientY , canvas.offsetTop , document.body.scrollTop);
    let ret = {
        x: cx,
        y: cy
    };
    return ret;
}




class Handler
{
    constructor()
    {
        this.bakugon = Graph.loadGraph("./images/bakugonR--32.png");
        this.tile = Graph.loadGraph("./images/magmaTile--32.png");
        this.shots = Graph.loadGraph("./images/ballShots--16.png");
        this.explode = Graph.loadGraph("./images/explode--32.png");
    }
}



class SceneChage
{
    static toMain()
    {
        clearInterval(gameLoopTimer);
        Main.set();
        gameLoopTimer = setInterval( Main.loop, 16 );
    }
    static toTitle()
    {
        clearInterval(gameLoopTimer);
        Title.set();
        gameLoopTimer = setInterval( Title.loop, 16 );
    }
    
}




//タイトル
class Title
{
    static set()
    {
        new BackGround();
        new TitleUi();
    }
    static loop()
    {
        Sprite.allUpdate();
        Sprite.allDrawing();    
        if (mouseState==0) 
        {
            Sprite.clear();
            SceneChage.toMain();
        }
    }
}

class TitleUi
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
    }
    drawing(x,y)
    {
        UiTexts.baseText();
        Useful.drawStringEdged(112*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "LEFT CLICK TO START THE GAME");
    }
}





//メインループ
class Main
{
    static count=0;
    static finishCount=0;
    static level=1;

    static set()
    {

        new Player();
        new UiTexts();
        new BackGround();
        new FireBallGenerator();
        new Cardinal();
        gameState = GAME_PLAYING;
        gameScore=0;
        Main.count=0;
        Main.finishCount=0;
    }

    static loop() 
    {
        context.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        Sprite.allUpdate();
        Sprite.allDrawing();

        Main.count++;
        switch(gameState)
        {
            case GAME_PLAYING:
                {
                    gameScore++;
                    break;
                }
            case GAME_OVER:
                {
                    Main.finishCount++;
                    if (Main.finishCount>60*4)
                    {
                        Sprite.clear();
                        SceneChage.toTitle();
                        return;
                    }
                    break;
                }
        }
    }


}







class Player
{
    constructor()
    {
        let sp = Sprite.set(hndl.bakugon, 0, 0, 32, 32);
        this.x=ROUGH_WIDTH/2-16;
        this.y=ROUGH_HEIGHT/2-16;
        this.count=0;
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        cls.move(cls, sp);
        Sprite.offset(sp, cls.x, cls.y, -50);
        
        {
            if (Sprite.hitRectangle(cls.x+10, cls.y+10, 32-20,32-20,COL_FIRE)>-1)
            {//ファイアボールと接触
                Sprite.clear(sp);
                new Effect.Explosion(cls.x-16, cls.y-16);
                new Effect.Explosion(cls.x-16, cls.y+16);
                new Effect.Explosion(cls.x+16, cls.y-16);
                new Effect.Explosion(cls.x+16, cls.y+16);
                gameState=GAME_OVER;
                return;
            }
        }

        {
            let c=parseInt((cls.count%80)/20);
            Sprite.image(sp,hndl.bakugon, c*32, 0, 32, 32);
        }
        cls.count++;
    }


    move(cls, sp)
    {
        let x1 = (curPosX+window.pageXOffset)/3-16, y1=((curPosY+window.pageYOffset)/3)-16;
        let dis=Math.sqrt(Math.pow(x1-cls.x,2)+Math.pow(y1-cls.y,2));
        if (dis<4) 
        {
            return;
        }

        let theta = Math.atan2(y1-cls.y, x1-cls.x);
        let v = 3;
        if (dis>80) v=6;
        cls.x += Math.cos(theta)*v;
        cls.y += Math.sin(theta)*v;
        if (cls.x<0) cls.x=0;
        if (cls.y<0) cls.y=0;
        if (cls.x>ROUGH_WIDTH-32) cls.x=ROUGH_WIDTH-32;
        if (cls.y>ROUGH_HEIGHT-32) cls.y=ROUGH_HEIGHT-32;
    }


}


class Effect
{
    static Explosion = class
    {
        constructor(x, y)
        {
            this.x=x;
            this.y=y;
            this.count=0;

            let sp=Sprite.set(hndl.explode, 0, 0, 32, 32);
            Sprite.offset(sp, x, y, -1000);
            Sprite.belong(sp, this);
            Sprite.update(sp, this.update);
        }
        update()
        {
            let sp=Sprite.callIndex;
            let cls=Sprite.belong(sp);

            let temp=5;
            {
                let c=parseInt((cls.count%(temp*4))/temp);
                Sprite.image(sp,hndl.explode, c*32, 0, 32, 32);    
            }
            cls.count++;
            if (cls.count>(temp*4)*6)
            {
                Sprite.clear(sp);
            }
        }

    }
}


















class UiTexts
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0 , 0, -4096);
        Useful.drawStringInit();
        //console.log(Sprite.sprite[sp],sp);

    }
    drawing(x, y)
    {
        UiTexts.baseText();
        
        //Useful.drawStringEdged(0, 48*2, curPosX + ", " + curPosY + "(" + mouseState + ")");
        //Useful.drawStringEdged(0, 48*4, Sprite.usedRate());
        
        if (gameState==GAME_OVER)
        {
            Useful.drawStringEdged(160*ROUGH_SCALE, SCREEN_HEIGHT/2-24, "G A M E  O V E R");
        }
    }
    static baseText()
    {
        Useful.drawStringEdged(0, 48*0, `Score: ${gameScore}`);
        {
            let t=`Level: ${Main.level}`
            if (Main.level>=7) t="Level: ∞"
            Useful.drawStringEdged(360*ROUGH_SCALE,0,t);
        }
    }

}


class BackGround
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this)
        Sprite.DrawingProcess(sp, this.drawing);
        Sprite.offset(sp, 0,0,4096);
    }
    drawing(x0, y0)
    {
        for (let x=0; x<13; x++)
        {
            for (let y=0; y<8; y++)
            {
                Graph.drawGraph(x*96, y*96, 0, 0, 32, 32, hndl.tile, 3);
            }
        }
    }

}


//ファイヤーボール
class FireBall
{
    constructor(type)
    {
        this.x=0;
        this.y=0;
        this.theta=0;
        this.count=0;
        this.type=type;
        
        let sp=Sprite.set();
        let cls = this;
        Sprite.belong(sp, cls);
        Sprite.update(sp,cls.update);
        let r=0;
        switch(Useful.rand(4))
        {
            case 0:
                {
                    cls.x=-16; cls.y=Useful.rand(ROUGH_HEIGHT-16);
                    r=Useful.rand2(-45, 45);
                    break;
                }
            case 1:
                {
                    cls.x=ROUGH_WIDTH; cls.y=Useful.rand(ROUGH_HEIGHT-16);
                    r=Useful.rand2(135,225);
                    break;
                }
            case 2:
                {
                    cls.y=-16; cls.x=Useful.rand(ROUGH_WIDTH-16);
                    r=Useful.rand2(45,135);
                    break;
                }
            case 3:
                {
                    cls.y=ROUGH_HEIGHT; cls.x=Useful.rand(ROUGH_WIDTH-16);
                    r=Useful.rand2(-135,-45);
                    break;
                }
        }
        cls.theta = (r/180.0)*Math.PI;
        Sprite.offset(sp, cls.x, cls.y);
        Sprite.collider(sp, 3,3,10,10, COL_FIRE);
        //console.log(Sprite.sprite[sp]);

    }

    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);
        {
            let vel=1;
            if (cls.type==1) vel=2;
            cls.x += Math.cos(cls.theta)*vel;
            cls.y += Math.sin(cls.theta)*vel;
            if (!Useful.between(cls.x, -16-8, ROUGH_WIDTH+8) || !Useful.between(cls.y, -16-8, ROUGH_HEIGHT+8))
            {
                Sprite.clear(sp);
                return;
            }
            Sprite.offset(sp, cls.x, cls.y, -100);
        }
        {
            let c=parseInt((cls.count%60)/20);
            Sprite.image(sp,hndl.shots, c*16, 16*cls.type, 16, 16);
        }
        cls.count++;
        //console.log(`FireBall ${sp} updated`);
    }
}
class FireBallGenerator
{
    constructor()
    {
        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        let c=Main.count;
        switch (Main.level)
        {
            case 1:
                {
                    if (c%30==0) new FireBall(0);
                    break;
                }
            case 2:
                {
                    if (c%20==0) new FireBall(Useful.rand(20)>0 ? 0 : 1);
                    break;
                }
            case 3:
                {
                    if (c%15==0) new FireBall(Useful.rand(10)>0 ? 0 : 1);
                    break;
                }
            case 4:
                {
                    if (c%10==0) new FireBall(Useful.rand(8)>0 ? 0 : 1);
                    break;
                }
            case 5:
                {
                    if (c%6==0) new FireBall(Useful.rand(8)>0 ? 0 : 1);
                    break;
                }
            case 6:
                {
                    if (c%3==0) new FireBall(Useful.rand(5)>0 ? 0 : 1);
                    break;
                }
            case 7:
                {
                    if (c%3==0) new FireBall(Useful.rand(3)>0 ? 0 : 1);
                    break;
                }


            }
        
    }
}





class Cardinal
{
    constructor()
    {
        Main.level=1;

        let sp=Sprite.set();
        Sprite.belong(sp, this);
        Sprite.update(sp, this.update);
    }
    update()
    {
        let sp=Sprite.callIndex;
        let cls=Sprite.belong(sp);

        {
            let c= Main.count;
            const sec=60;
            if (c>=10*sec) Main.level = 2;
            if (c>=20*sec) Main.level = 3;
            if (c>=30*sec) Main.level = 4;
            if (c>=45*sec) Main.level = 5;
            if (c>=60*sec) Main.level = 6;
            if (c>=90*sec) Main.level = 7;
        }
    }
}

















//お役立ちクラス
class Useful
{
    static drawStringInit()
    {
        context.font = "48px 'Impact'";
        context.lineWidth = "8";
        context.lineJoin = "miter";
        context.miterLimit = "5"
    }

    static drawStringEdged(x, y, text, inColor="#ffffff")
    {
        y+=48;
        context.strokeText(text, x, y);
        context.fillStyle = "#ffffff"
        context.fillText(text, x, y);

    }

    static rand(n)
    {
        return parseInt(Math.random()*n,10);
    }
    static rand2(min, max)
    {
        return min+this.rand(max-min);
    }
    static between(n, min, max)
    {
        return (min<=n && n <= max);
    }
    static isString(obj) {
        return typeof (obj) == "string" || obj instanceof String;
    };

}









class SpriteCompornent
{
    constructor()
    {
        this.used=false;
        this.x = 0;
        this.y = 0;
        this.image = -1;
        this.u = 0;
        this.v=0;
        this.width = 0;
        this.height=0;
        this.reverse=false;
        this.mask=false;
        this.link=-1;
        
        this.colliderX=0;
        this.colliderY=0;
        this.colliderWidth=0;
        this.colliderHeight=0;
    
        this.belong = undefined;

        this.update = function(){};
        this.drawing = Sprite.Drawing.rough;
    }    

}





class Sprite
{
    static SPRITE_MAX = 512;
    static sprite;
    static sprite_Z = []

    static nextNum=0;
    static roughScale = 3;

    static callIndex;

    static init()
    {
        this.sprite = new Array(this.SPRITE_MAX);
        this.sprite_Z = [];
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            this.sprite[i] = new SpriteCompornent();
            this.sprite_Z.push([i, 0]);
        }

        console.log("Sprite init succeeded");
    }

    static set(imageHndl=-1, u=0, v=0, w=16, h=16)
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            let sp=(this.nextNum+i) % this.SPRITE_MAX;

            if(this.sprite[sp].used==false)
            {
                this.sprite[sp] = new SpriteCompornent();
                this.sprite_Z[sp][1]=0;
                this.sprite[sp].used=true;
                this.sprite[sp].image = imageHndl;
                this.sprite[sp].width=w;
                this.sprite[sp].height=h;

                this.sprite[sp].colliderWidth=w;
                this.sprite[sp].colliderHeight=h;

                this.nextNum=sp+1;
                return sp;
            }
        }

        return -1;
    }

    static reverse(sp, rev=true)
    {
        this.sprite[sp].reverse = rev;
    }
    static image(sp, imageHndl=undefined, u=undefined, v=undefined, w=undefined, h=undefined)
    {
        if (imageHndl!==undefined) this.sprite[sp].image = imageHndl;
        if (u!==undefined) this.sprite[sp].u = u;
        if (v!==undefined) this.sprite[sp].v = v;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
    }

    static offset(sp, x, y, z=undefined)
    {
        this.sprite[sp].x = x;
        this.sprite[sp].y = y;
        if (z!==undefined) 
        {
            this.sprite_Z[sp][1] = z;
        }
    }
    static screenXY(sp)
    {
        let x=this.sprite[sp].x + this.linkDifference_X(sp);
        let y=this.sprite[sp].y + this.linkDifference_Y(sp);
        return [x, y];
    }

    static belong(sp, cls=undefined)
    {
        if (cls==undefined) return this.sprite[sp].belong;
        this.sprite[sp].belong = cls;
    }

    static link(sp, link)
    {
        this.sprite[sp].link = link
    }

    static linkDifference_X(sp)
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].x + this.linkDifference_X(spli);
        }else{
            return 0
        }
    }
    static linkDifference_Y(sp)
    {
        if(this.sprite[sp].link != -1){
            let spli = this.sprite[sp].link;
            return this.sprite[spli].y + this.linkDifference_Y(spli);
        }else{
            return 0
        }
    }
    static update(sp, func)
    {
        this.sprite[sp].update = func;
    }
    static DrawingProcess(sp,func)
    {
        this.sprite[sp].drawing = func;
    }
    static clear(sp=undefined)
    {
        if(sp!==undefined)
        {
            this.sprite[sp].used = false;
            this.nextNum = sp+1;
        }else{
            for(let i=0; i<this.SPRITE_MAX; i++)
            {
                this.sprite[i].used = false;
            }
        }
    }

    static collider(sp, x=undefined, y=undefined, w=undefined, h=undefined, mask=undefined)
    {
        if (x!==undefined) this.sprite[sp].x = x;
        if (y!==undefined) this.sprite[sp].y = y;
        if (w!==undefined) this.sprite[sp].width = w;
        if (h!==undefined) this.sprite[sp].height = h;
        if (mask!==undefined) this.sprite[sp].mask = mask;
    }

    static hitRectangle(x, y, width, height, mask, min=0, max=this.SPRITE_MAX)
    {
        let x1=x, y1=y, w1=width, h1=height;
        //console.log(min+","+max);
        for(let i=min; i<max; i++)
        {
            if (this.sprite[i].used==true && (this.sprite[i].mask & mask)!=0)
            {
                let x2=this.sprite[i].x + this.linkDifference_X(i) + this.sprite[i].colliderX;
                let y2=this.sprite[i].y + this.linkDifference_Y(i) + this.sprite[i].colliderY;
                let w2=this.sprite[i].width;
                let h2=this.sprite[i].height;

                if ((Math.abs(x2-x1)<w1/2+w2/2)
                    &&
                    (Math.abs(y2-y1)<h1/2+h2/2))
                    {
                        return i;
                    }
            }
        }
    }



    static usedRate()
    {
        let c=0;
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if (this.sprite[i].used) c+=1;
        }
        return c+" / "+this.SPRITE_MAX;
    }


    static allUpdate()
    {
        for(let i=0; i<this.SPRITE_MAX; i++)
        {
            if(this.sprite[i].used==true) {
                this.callIndex = i;
                this.sprite[i].update();
                //console.log(this.sprite[i]);   
            }
        }
    }

    static allDrawing()
    {
        let ol = this.sprite_Z.slice();
        ol.sort(function(a, b){return b[1]-a[1]});
        for (let i in ol)
        {
            let sp = ol[i][0];
            if(this.sprite[sp].used==true)
            {

                let x, y;
                if(this.sprite[sp].link!=-1)
                {
                    x=parseInt(this.sprite[sp].x + this.linkDifference_X(sp), 10);
                    y=parseInt(this.sprite[sp].y + this.linkDifference_X(sp), 10);
                }
                else
                {
                    x=parseInt(this.sprite[sp].x, 10)
                    y=parseInt(this.sprite[sp].y, 10)
                }
                x *= this.roughScale;
                y *= this.roughScale;
                this.callIndex = sp;
                this.sprite[sp].drawing(x, y);
            }

        }
    }

    static Drawing = class
    {
        static rough(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, Sprite.roughScale);
        }
        static detail(x, y)
        {
            let sp=Sprite.callIndex;
            Sprite.Drawing.draw(sp, x, y, 1);
        }
        static draw(sp, x, y, scale)
        {
            if (Sprite.sprite[sp].image==-1) return;
            let spr=Sprite.sprite[sp];
            Graph.drawGraph(x, y, spr.u, spr.v, spr.width, spr.height, spr.image, scale);
        }
    }


}


//グラフィック読み込み
class Graph
{
    static images_={}
    static imageIndex_=0;
    //画像読み込み
    static loadGraph(path)
    {
        let handler=this.imageIndex_;
        this.images_[handler] = new Image;
        this.images_[handler].src=path;
        this.imageIndex_++;
        return handler;
    }
    //描画
    static drawGraph(x, y, u, v, w, h, handle, scale)
    {
        context.drawImage(this.images_[handle], u, v, w, h, x, y, w*scale, h*scale);
    }
}















