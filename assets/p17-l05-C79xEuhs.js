var e=`p17-l05`,t=40,n=`Most image processing is sliding a small kernel over the image. You implement 2D correlation with OpenCV’s border rule, Gaussian smoothing and Sobel gradients, then build a Canny edge detector with non-maximum suppression and hysteresis, matching OpenCV’s filters exactly and its edges to within a pixel.`,r=`<h2 id="sliding-a-kernel">Sliding a kernel</h2>
<p>A linear filter replaces each pixel by a weighted sum of its neighbourhood:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="mopen">(</span><span class="mord mathnormal">i</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0572em;">j</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:2.4882em;vertical-align:-1.4382em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.05em;"><span style="top:-1.8479em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">a</span><span class="mpunct mtight">,</span><span class="mord mathnormal mtight">b</span></span></span></span><span style="top:-3.05em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.4382em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mopen">(</span><span class="mord mathnormal">a</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mclose">)</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.1076em;">f</span><span class="mopen">(</span><span class="mord mathnormal">i</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.854em;vertical-align:-0.1944em;"></span><span class="mord mathnormal">a</span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal" style="margin-right:0.0572em;">j</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mord mathnormal">b</span><span class="mclose">)</span><span class="mord">.</span></span></span></span></span></div>
<p>Strictly that is <strong>correlation</strong>; convolution flips the kernel first, which only matters for asymmetric kernels. Near the border some neighbours do not exist, so the image is padded. OpenCV’s default, <code>BORDER_REFLECT_101</code>, mirrors without repeating the edge pixel: <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="minner">…</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∣</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal">a</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">b</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord mathnormal">c</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner">…</span></span></span></span>.</p>
<p>A <strong>Gaussian</strong> kernel, <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">∝</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.9869em;"></span><span class="mord"><span class="mord mathnormal">e</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.9869em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mopen mtight">(</span><span class="mord mtight"><span class="mord mathnormal mtight">a</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8913em;"><span style="top:-2.931em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mbin mtight">+</span><span class="mord mtight"><span class="mord mathnormal mtight">b</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8913em;"><span style="top:-2.931em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mclose mtight">)</span><span class="mord mtight">/2</span><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">σ</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8913em;"><span style="top:-2.931em;margin-right:0.0714em;"><span class="pstrut" style="height:2.5em;"></span><span class="katex-sizing reset-size3 size1 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span> normalised to sum 1, smooths noise. It is separable (an outer product of 1D kernels), so a <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7778em;vertical-align:-0.0833em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> blur costs <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6944em;"></span><span class="mord">2</span><span class="mord mathnormal" style="margin-right:0.0315em;">k</span></span></span></span> instead of <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0315em;">k</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span> operations per pixel.</p>
<h2 id="gradients">Gradients</h2>
<p>The <strong>Sobel</strong> kernel combines a derivative <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">−</span><span class="mord">1</span><span class="mspace">\xA0</span><span class="mord">0</span><span class="mspace">\xA0</span><span class="mord">1</span><span class="mclose">]</span></span></span></span> along <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span></span></span></span> with smoothing <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1em;vertical-align:-0.25em;"></span><span class="mopen">[</span><span class="mord">1</span><span class="mspace">\xA0</span><span class="mord">2</span><span class="mspace">\xA0</span><span class="mord">1</span><span class="mclose">]</span></span></span></span> across:</p>
<div class="math-scroll"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.8333em;vertical-align:-0.15em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:3.6em;vertical-align:-1.55em;"></span><span class="minner"><span class="mopen"><span class="delimsizing mult"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:2.05em;"><span style="top:-4.05em;"><span class="pstrut" style="height:5.6em;"></span><span style="width:0.875em;height:3.6em;"><svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="3.6em" viewBox="0 0 875 3600"><path d="M863,9c0,-2,-2,-5,-6,-9c0,0,-17,0,-17,0c-12.7,0,-19.3,0.3,-20,1
c-5.3,5.3,-10.3,11,-15,17c-242.7,294.7,-395.3,682,-458,1162c-21.3,163.3,-33.3,349,
-36,557 l0,84c0.2,6,0,26,0,60c2,159.3,10,310.7,24,454c53.3,528,210,
949.7,470,1265c4.7,6,9.7,11.7,15,17c0.7,0.7,7,1,19,1c0,0,18,0,18,0c4,-4,6,-7,6,-9
c0,-2.7,-3.3,-8.7,-10,-18c-135.3,-192.7,-235.5,-414.3,-300.5,-665c-65,-250.7,-102.5,
-544.7,-112.5,-882c-2,-104,-3,-167,-3,-189
l0,-92c0,-162.7,5.7,-314,17,-454c20.7,-272,63.7,-513,129,-723c65.3,
-210,155.3,-396.3,270,-559c6.7,-9.3,10,-15.3,10,-18z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.55em;"><span></span></span></span></span></span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:2.05em;"><span style="top:-4.21em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">−</span><span class="mord">1</span></span></span><span style="top:-3.01em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">−</span><span class="mord">2</span></span></span><span style="top:-1.81em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">−</span><span class="mord">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.55em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:2.05em;"><span style="top:-4.21em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0</span></span></span><span style="top:-3.01em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0</span></span></span><span style="top:-1.81em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">0</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.55em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:2.05em;"><span style="top:-4.21em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1</span></span></span><span style="top:-3.01em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">2</span></span></span><span style="top:-1.81em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord">1</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.55em;"><span></span></span></span></span></span></span></span><span class="mclose"><span class="delimsizing mult"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:2.05em;"><span style="top:-4.05em;"><span class="pstrut" style="height:5.6em;"></span><span style="width:0.875em;height:3.6em;"><svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="3.6em" viewBox="0 0 875 3600"><path d="M76,0c-16.7,0,-25,3,-25,9c0,2,2,6.3,6,13c21.3,28.7,42.3,60.3,
63,95c96.7,156.7,172.8,332.5,228.5,527.5c55.7,195,92.8,416.5,111.5,664.5
c11.3,139.3,17,290.7,17,454c0,28,1.7,43,3.3,45l0,9
c-3,4,-3.3,16.7,-3.3,38c0,162,-5.7,313.7,-17,455c-18.7,248,-55.8,469.3,-111.5,664
c-55.7,194.7,-131.8,370.3,-228.5,527c-20.7,34.7,-41.7,66.3,-63,95c-2,3.3,-4,7,-6,11
c0,7.3,5.7,11,17,11c0,0,11,0,11,0c9.3,0,14.3,-0.3,15,-1c5.3,-5.3,10.3,-11,15,-17
c242.7,-294.7,395.3,-681.7,458,-1161c21.3,-164.7,33.3,-350.7,36,-558
l0,-144c-2,-159.3,-10,-310.7,-24,-454c-53.3,-528,-210,-949.7,
-470,-1265c-4.7,-6,-9.7,-11.7,-15,-17c-0.7,-0.7,-6.7,-1,-18,-1z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.55em;"><span></span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mpunct">,</span><span class="mspace" style="margin-right:2em;"></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:1.1461em;vertical-align:-0.247em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0576em;">S</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8991em;"><span style="top:-2.453em;margin-left:-0.0576em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">⊤</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span><span class="mord">.</span></span></span></span></span></div>
<p>The gradient magnitude <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.84em;vertical-align:-0.6765em;"></span><span class="mord sqrt"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.1635em;"><span class="svg-align" style="top:-3.8em;"><span class="pstrut" style="height:3.8em;"></span><span class="mord" style="padding-left:1em;"><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.453em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.247em;"><span></span></span></span></span></span></span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.7401em;"><span style="top:-2.453em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span><span style="top:-2.989em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.3831em;"><span></span></span></span></span></span></span></span></span><span style="top:-3.1235em;"><span class="pstrut" style="height:3.8em;"></span><span class="hide-tail" style="min-width:1.02em;height:1.88em;"><svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.88em" viewBox="0 0 400000 1944" preserveAspectRatio="xMinYMin slice"><path d="M983 90
l0 -0
c4,-6.7,10,-10,18,-10 H400000v40
H1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7
s-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744
c-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30
c26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722
c56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5
c53.7,-170.3,84.5,-266.8,92.5,-289.5z
M1001 80h400000v40h-400000z"/></svg></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.6765em;"><span></span></span></span></span></span></span></span></span> is large at edges and its direction <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.0361em;vertical-align:-0.2861em;"></span><span class="mop"><span class="mord mathrm">atan2</span></span><span class="mopen">(</span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight" style="margin-right:0.0359em;">y</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2861em;"><span></span></span></span></span></span></span><span class="mpunct">,</span><span class="mspace" style="margin-right:0.1667em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.0359em;">g</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.1514em;"><span style="top:-2.55em;margin-left:-0.0359em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mathnormal mtight">x</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.15em;"><span></span></span></span></span></span></span><span class="mclose">)</span></span></span></span> is perpendicular to them.</p>
<h2 id="canny">Canny</h2>
<p>Thresholding the magnitude gives thick, broken edges. Canny’s detector fixes both:</p>
<ol>
<li><strong>Smooth</strong> with a Gaussian.</li>
<li><strong>Gradient</strong> with Sobel.</li>
<li><strong>Non-maximum suppression</strong>: keep a pixel only if its magnitude is at least that of both neighbours along the gradient direction (rounded to 0°, 45°, 90° or 135°). Edges become one pixel thick.</li>
<li><strong>Hysteresis</strong>: pixels above a high threshold are edges; pixels above a low threshold are edges only if connected to one. Noise rarely forms connected chains, true edges do.</li>
</ol>

<figure class="fig"><div class="fig-body"><div class="widget" data-widget="edges" data-args="{}"></div></div><figcaption>An illustrative noisy scene through each stage of Canny. Pick the stage to show and move the two hysteresis thresholds and the blur.</figcaption></figure>
<h2 id="worked-example">Worked example</h2>
<p>An illustrative 160 × 120 grey scene: a bright square and a dark disc on a mid-grey background, with noise of standard deviation 4.</p>
<ol>
<li>Sobel <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span></span></span></span> across a 100-level vertical step gives <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.6444em;"></span><span class="mord">400</span></span></span></span> on the two columns either side of it (the kernel weights 1 + 2 + 1 = 4 times the step) and 0 elsewhere.</li>
<li>Our Sobel equals <code>cv2.Sobel</code> exactly, and our Gaussian blur matches <code>cv2.GaussianBlur</code> to <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">1.7</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">×</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="katex-base"><span class="katex-strut" style="height:0.8141em;"></span><span class="mord">1</span><span class="mord"><span class="mord">0</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8141em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">−</span><span class="mord mtight">13</span></span></span></span></span></span></span></span></span></span></span></span>.</li>
<li>Canny with thresholds 40 and 100 finds 404 edge pixels; <code>cv2.Canny</code> (with the L2 gradient) finds 403. Every one of ours is within 1 px of one of OpenCV’s and vice versa; the small differences come from the rounding of the blurred image and the direction bins.</li>
<li>All edge pixels lie within 2 px of a true boundary.</li>
</ol>
<h2 id="code-it-from-scratch">Code it from scratch</h2>

<div class="code-card" data-code="0"><div class="code-head"><span class="fname" translate="no">edges.py</span><button class="btn btn-quiet btn-small" type="button" data-copy="0">Copy</button><button class="btn btn-quiet btn-small" type="button" data-download="0">Download</button></div><pre tabindex="0"><code class="language-python"><span class="hljs-keyword">import</span> numpy <span class="hljs-keyword">as</span> np
<span class="hljs-keyword">try</span>:
    <span class="hljs-keyword">import</span> cv2
<span class="hljs-keyword">except</span> ImportError:
    cv2 = <span class="hljs-literal">None</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">correlate</span>(<span class="hljs-params">img, k</span>):
    <span class="hljs-string">&quot;&quot;&quot;2D correlation (convolution without the flip) with OpenCV&#x27;s default border, reflect-101 (... c b | a b c | b a ...)&quot;&quot;&quot;</span>
    r = k.shape[<span class="hljs-number">0</span>] // <span class="hljs-number">2</span>; p = np.pad(img.astype(<span class="hljs-built_in">float</span>), r, mode=<span class="hljs-string">&quot;reflect&quot;</span>)
    out = np.zeros(img.shape)
    <span class="hljs-keyword">for</span> i <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(k.shape[<span class="hljs-number">0</span>]):
        <span class="hljs-keyword">for</span> j <span class="hljs-keyword">in</span> <span class="hljs-built_in">range</span>(k.shape[<span class="hljs-number">1</span>]):
            out += k[i, j] * p[i:i + img.shape[<span class="hljs-number">0</span>], j:j + img.shape[<span class="hljs-number">1</span>]]
    <span class="hljs-keyword">return</span> out

<span class="hljs-keyword">def</span> <span class="hljs-title function_">gaussian_kernel</span>(<span class="hljs-params">sigma, size</span>):
    x = np.arange(size) - size // <span class="hljs-number">2</span>; g = np.exp(-x ** <span class="hljs-number">2</span> / (<span class="hljs-number">2</span> * sigma ** <span class="hljs-number">2</span>)); g /= g.<span class="hljs-built_in">sum</span>()
    <span class="hljs-keyword">return</span> np.outer(g, g)

SOBEL_X = np.array([[-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>], [-<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>], [-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]], <span class="hljs-built_in">float</span>)    <span class="hljs-comment"># smoothing [1 2 1] across, derivative [-1 0 1] along</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">make_image</span>(<span class="hljs-params">noise=<span class="hljs-number">4.0</span>, seed=<span class="hljs-number">0</span></span>):
    <span class="hljs-string">&quot;&quot;&quot;illustrative 120 x 160 grey scene: a bright square and a darker disc on a mid background&quot;&quot;&quot;</span>
    rng = np.random.default_rng(seed); y, x = np.mgrid[<span class="hljs-number">0</span>:<span class="hljs-number">120</span>, <span class="hljs-number">0</span>:<span class="hljs-number">160</span>]
    img = np.full((<span class="hljs-number">120</span>, <span class="hljs-number">160</span>), <span class="hljs-number">90.0</span>); img[<span class="hljs-number">30</span>:<span class="hljs-number">80</span>, <span class="hljs-number">20</span>:<span class="hljs-number">70</span>] = <span class="hljs-number">200</span>
    img[(x - <span class="hljs-number">115</span>) ** <span class="hljs-number">2</span> + (y - <span class="hljs-number">65</span>) ** <span class="hljs-number">2</span> &lt; <span class="hljs-number">28</span> ** <span class="hljs-number">2</span>] = <span class="hljs-number">30</span>
    <span class="hljs-keyword">return</span> np.clip(img + rng.normal(<span class="hljs-number">0</span>, noise, img.shape), <span class="hljs-number">0</span>, <span class="hljs-number">255</span>).astype(np.uint8)

<span class="hljs-keyword">def</span> <span class="hljs-title function_">canny</span>(<span class="hljs-params">img, lo, hi</span>):
    <span class="hljs-string">&quot;&quot;&quot;Gaussian blur, Sobel gradients, non-maximum suppression along the gradient, hysteresis thresholds&quot;&quot;&quot;</span>
    g = correlate(img, gaussian_kernel(<span class="hljs-number">1.4</span>, <span class="hljs-number">5</span>))
    gx, gy = correlate(g, SOBEL_X), correlate(g, SOBEL_X.T)
    mag = np.hypot(gx, gy); ang = (np.degrees(np.arctan2(gy, gx)) + <span class="hljs-number">180</span>) % <span class="hljs-number">180</span>
    nms = np.zeros_like(mag); H, W = mag.shape
    q = np.<span class="hljs-built_in">round</span>(ang / <span class="hljs-number">45</span>).astype(<span class="hljs-built_in">int</span>) % <span class="hljs-number">4</span>                          <span class="hljs-comment"># 0: E-W, 1: NE-SW, 2: N-S, 3: NW-SE neighbours</span>
    off = {<span class="hljs-number">0</span>: (<span class="hljs-number">0</span>, <span class="hljs-number">1</span>), <span class="hljs-number">1</span>: (<span class="hljs-number">1</span>, <span class="hljs-number">1</span>), <span class="hljs-number">2</span>: (<span class="hljs-number">1</span>, <span class="hljs-number">0</span>), <span class="hljs-number">3</span>: (<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>)}
    <span class="hljs-keyword">for</span> d, (di, dj) <span class="hljs-keyword">in</span> off.items():
        m = q == d
        a = np.roll(np.roll(mag, -di, <span class="hljs-number">0</span>), -dj, <span class="hljs-number">1</span>); b = np.roll(np.roll(mag, di, <span class="hljs-number">0</span>), dj, <span class="hljs-number">1</span>)
        keep = m &amp; (mag &gt;= a) &amp; (mag &gt;= b); nms[keep] = mag[keep]
    nms[[<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>], :] = <span class="hljs-number">0</span>; nms[:, [<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>]] = <span class="hljs-number">0</span>
    strong = nms &gt;= hi; weak = nms &gt;= lo; edges = strong.copy()
    <span class="hljs-keyword">while</span> <span class="hljs-literal">True</span>:                                                    <span class="hljs-comment"># grow strong edges through connected weak pixels</span>
        grown = weak &amp; (np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">0</span>:-<span class="hljs-number">2</span>, <span class="hljs-number">0</span>:-<span class="hljs-number">2</span>] | np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">0</span>:-<span class="hljs-number">2</span>, <span class="hljs-number">1</span>:-<span class="hljs-number">1</span>] | np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">0</span>:-<span class="hljs-number">2</span>, <span class="hljs-number">2</span>:] |
                        np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">1</span>:-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>:-<span class="hljs-number">2</span>] | np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">1</span>:-<span class="hljs-number">1</span>, <span class="hljs-number">2</span>:] | np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">2</span>:, <span class="hljs-number">0</span>:-<span class="hljs-number">2</span>] |
                        np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">2</span>:, <span class="hljs-number">1</span>:-<span class="hljs-number">1</span>] | np.pad(edges, <span class="hljs-number">1</span>)[<span class="hljs-number">2</span>:, <span class="hljs-number">2</span>:] | edges)
        <span class="hljs-keyword">if</span> (grown == edges).<span class="hljs-built_in">all</span>(): <span class="hljs-keyword">break</span>
        edges = grown
    <span class="hljs-keyword">return</span> edges, mag

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_sobel_step</span>():
    img = np.zeros((<span class="hljs-number">5</span>, <span class="hljs-number">6</span>)); img[:, <span class="hljs-number">3</span>:] = <span class="hljs-number">100</span>
    gx = correlate(img, SOBEL_X)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Sobel x across a 100-level vertical step: <span class="hljs-subst">{gx[<span class="hljs-number">2</span>].tolist()}</span>&quot;</span>)
    <span class="hljs-keyword">assert</span> gx[<span class="hljs-number">2</span>, <span class="hljs-number">2</span>] == <span class="hljs-number">400</span> <span class="hljs-keyword">and</span> gx[<span class="hljs-number">2</span>, <span class="hljs-number">3</span>] == <span class="hljs-number">400</span> <span class="hljs-keyword">and</span> gx[<span class="hljs-number">2</span>, <span class="hljs-number">0</span>] == <span class="hljs-number">0</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_matches_opencv</span>():
    img = make_image()
    gx = correlate(img, SOBEL_X); blur = correlate(img, gaussian_kernel(<span class="hljs-number">1.4</span>, <span class="hljs-number">5</span>))
    edges, mag = canny(img, <span class="hljs-number">40</span>, <span class="hljs-number">100</span>)
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;Canny with thresholds 40 and 100: <span class="hljs-subst">{edges.<span class="hljs-built_in">sum</span>()}</span> edge pixels&quot;</span>)
    <span class="hljs-keyword">if</span> cv2 <span class="hljs-keyword">is</span> <span class="hljs-literal">None</span>: <span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;OpenCV not installed: skipping the comparison&quot;</span>); <span class="hljs-keyword">return</span>
    e1 = np.<span class="hljs-built_in">abs</span>(gx - cv2.Sobel(img, cv2.CV_64F, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, ksize=<span class="hljs-number">3</span>)).<span class="hljs-built_in">max</span>()
    e2 = np.<span class="hljs-built_in">abs</span>(blur - cv2.GaussianBlur(img.astype(<span class="hljs-built_in">float</span>), (<span class="hljs-number">5</span>, <span class="hljs-number">5</span>), <span class="hljs-number">1.4</span>)).<span class="hljs-built_in">max</span>()
    ref = cv2.Canny(cv2.GaussianBlur(img, (<span class="hljs-number">5</span>, <span class="hljs-number">5</span>), <span class="hljs-number">1.4</span>), <span class="hljs-number">40</span>, <span class="hljs-number">100</span>, L2gradient=<span class="hljs-literal">True</span>) &gt; <span class="hljs-number">0</span>
    near = cv2.dilate(ref.astype(np.uint8), np.ones((<span class="hljs-number">3</span>, <span class="hljs-number">3</span>), np.uint8)) &gt; <span class="hljs-number">0</span>
    agree = (edges &amp; near).<span class="hljs-built_in">sum</span>() / edges.<span class="hljs-built_in">sum</span>(); recall = (ref &amp; (cv2.dilate(edges.astype(np.uint8), np.ones((<span class="hljs-number">3</span>, <span class="hljs-number">3</span>), np.uint8)) &gt; <span class="hljs-number">0</span>)).<span class="hljs-built_in">sum</span>() / ref.<span class="hljs-built_in">sum</span>()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;vs cv2.Sobel <span class="hljs-subst">{e1:<span class="hljs-number">.1</span>e}</span>, cv2.GaussianBlur <span class="hljs-subst">{e2:<span class="hljs-number">.1</span>e}</span>; cv2.Canny <span class="hljs-subst">{ref.<span class="hljs-built_in">sum</span>()}</span> edge pixels, &quot;</span>
          <span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-number">100</span> * agree:<span class="hljs-number">.1</span>f}</span> % of ours within 1 px of OpenCV&#x27;s and <span class="hljs-subst">{<span class="hljs-number">100</span> * recall:<span class="hljs-number">.1</span>f}</span> % of OpenCV&#x27;s within 1 px of ours&quot;</span>)
    <span class="hljs-keyword">assert</span> e1 &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> e2 &lt; <span class="hljs-number">1e-9</span> <span class="hljs-keyword">and</span> agree &gt; <span class="hljs-number">0.95</span> <span class="hljs-keyword">and</span> recall &gt; <span class="hljs-number">0.95</span>

<span class="hljs-keyword">def</span> <span class="hljs-title function_">test_edges_on_boundaries</span>():
    img = make_image(); edges, _ = canny(img, <span class="hljs-number">40</span>, <span class="hljs-number">100</span>)
    y, x = np.nonzero(edges)
    on_sq = (np.minimum.reduce([np.<span class="hljs-built_in">abs</span>(y - <span class="hljs-number">29.5</span>), np.<span class="hljs-built_in">abs</span>(y - <span class="hljs-number">79.5</span>)]) &lt;= <span class="hljs-number">2</span>) &amp; (x &gt;= <span class="hljs-number">18</span>) &amp; (x &lt;= <span class="hljs-number">71</span>) | \\
            (np.minimum.reduce([np.<span class="hljs-built_in">abs</span>(x - <span class="hljs-number">19.5</span>), np.<span class="hljs-built_in">abs</span>(x - <span class="hljs-number">69.5</span>)]) &lt;= <span class="hljs-number">2</span>) &amp; (y &gt;= <span class="hljs-number">28</span>) &amp; (y &lt;= <span class="hljs-number">81</span>)
    on_disc = np.<span class="hljs-built_in">abs</span>(np.hypot(x - <span class="hljs-number">115</span>, y - <span class="hljs-number">65</span>) - <span class="hljs-number">28</span>) &lt;= <span class="hljs-number">2</span>
    frac = (on_sq | on_disc).mean()
    <span class="hljs-built_in">print</span>(<span class="hljs-string">f&quot;<span class="hljs-subst">{<span class="hljs-number">100</span> * frac:<span class="hljs-number">.1</span>f}</span> % of edge pixels lie within 2 px of a true boundary&quot;</span>)
    <span class="hljs-keyword">assert</span> frac &gt; <span class="hljs-number">0.98</span>

test_sobel_step()
test_matches_opencv()
test_edges_on_boundaries()
<span class="hljs-built_in">print</span>(<span class="hljs-string">&quot;PASS&quot;</span>)</code></pre></div>
<h2 id="exercises">Exercises</h2>

<div class="exercise"><div class="ex-q"><p>What does the kernel <span class="katex"><span class="katex-html" aria-hidden="true"><span class="katex-base"><span class="katex-strut" style="height:1.1901em;vertical-align:-0.345em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.8451em;"><span style="top:-2.655em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">9</span></span></span></span><span style="top:-3.23em;"><span class="pstrut" style="height:3em;"></span><span class="frac-line" style="border-bottom-width:0.04em;"></span></span><span style="top:-3.394em;"><span class="pstrut" style="height:3em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">1</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.345em;"><span></span></span></span></span></span><span class="mclose nulldelimiter"></span></span><span class="mord"><span class="mord mathbf">1</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.3011em;"><span style="top:-2.55em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="katex-sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mtight">3</span><span class="mbin mtight">×</span><span class="mord mtight">3</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.2083em;"><span></span></span></span></span></span></span></span></span></span> do, and why is a Gaussian usually preferred?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>It is a box blur: the mean of the 3 × 3 neighbourhood. Its frequency response has ripples, so it leaves some high-frequency noise and creates artefacts; the Gaussian falls off smoothly and is the only kernel that is both separable and rotationally symmetric.</p>
</div></details></div>

<div class="exercise"><div class="ex-q"><p>Why does Canny use two thresholds rather than one?</p>
</div><details><summary>Show the solution</summary><div class="ex-s"><p>One high threshold breaks real edges where they weaken briefly; one low threshold lets noise through. Hysteresis keeps weak pixels only when they connect to a strong one, so edges stay continuous while isolated noise is rejected.</p>
</div></details></div>
<h2 id="quiz">Quiz</h2>

<div class="quiz" data-quiz="p17-l05"></div>
`,i=[{id:`sliding-a-kernel`,title:`Sliding a kernel`},{id:`gradients`,title:`Gradients`},{id:`canny`,title:`Canny`},{id:`worked-example`,title:`Worked example`},{id:`code-it-from-scratch`,title:`Code it from scratch`},{id:`exercises`,title:`Exercises`},{id:`quiz`,title:`Quiz`}],a=[{id:`p17-l05-q1`,type:`num`,q:`<p>Sobel x response at a vertical step of 50 levels?</p>
`,explain:`<p>The kernel weights 1 + 2 + 1 on the bright side.</p>
`,answer:200,tol:.001,unit:``},{id:`p17-l05-q2`,type:`num`,q:`<p>Multiplications per pixel for a separable 7 × 7 Gaussian?</p>
`,explain:`<p>Two 1D passes of 7 taps.</p>
`,answer:14,tol:.001,unit:``},{id:`p17-l05-q3`,type:`num`,q:`<p>Gradient magnitude with gx = 300 and gy = 400?</p>
`,explain:`<p>The square root of the sum of squares.</p>
`,answer:500,tol:.001,unit:``},{id:`p17-l05-q4`,type:`num`,q:`<p>Sum of the weights of a normalised Gaussian kernel?</p>
`,explain:`<p>Normalisation keeps the mean brightness.</p>
`,answer:1,tol:.001,unit:``},{id:`p17-l05-q5`,type:`mc`,q:`<p>Non-maximum suppression compares a pixel’s magnitude with its neighbours…</p>
`,explain:`<p>Across the edge, so the ridge becomes one pixel wide.</p>
`,options:[`in the previous frame`,`along the gradient direction`,`along the edge direction`,`in all 8 directions`],answer:1},{id:`p17-l05-q6`,type:`mc`,q:`<p>In hysteresis, a pixel between the low and high thresholds is an edge if…</p>
`,explain:`<p>Weak pixels survive only through strong ones.</p>
`,options:[`it is a local maximum`,`its neighbours are below the low threshold`,`always`,`it connects to a pixel above the high threshold`],answer:3}],o=[{file:`edges.py`,lang:`python`,src:`import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

def correlate(img, k):
    """2D correlation (convolution without the flip) with OpenCV's default border, reflect-101 (... c b | a b c | b a ...)"""
    r = k.shape[0] // 2; p = np.pad(img.astype(float), r, mode="reflect")
    out = np.zeros(img.shape)
    for i in range(k.shape[0]):
        for j in range(k.shape[1]):
            out += k[i, j] * p[i:i + img.shape[0], j:j + img.shape[1]]
    return out

def gaussian_kernel(sigma, size):
    x = np.arange(size) - size // 2; g = np.exp(-x ** 2 / (2 * sigma ** 2)); g /= g.sum()
    return np.outer(g, g)

SOBEL_X = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], float)    # smoothing [1 2 1] across, derivative [-1 0 1] along

def make_image(noise=4.0, seed=0):
    """illustrative 120 x 160 grey scene: a bright square and a darker disc on a mid background"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 90.0); img[30:80, 20:70] = 200
    img[(x - 115) ** 2 + (y - 65) ** 2 < 28 ** 2] = 30
    return np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)

def canny(img, lo, hi):
    """Gaussian blur, Sobel gradients, non-maximum suppression along the gradient, hysteresis thresholds"""
    g = correlate(img, gaussian_kernel(1.4, 5))
    gx, gy = correlate(g, SOBEL_X), correlate(g, SOBEL_X.T)
    mag = np.hypot(gx, gy); ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    nms = np.zeros_like(mag); H, W = mag.shape
    q = np.round(ang / 45).astype(int) % 4                          # 0: E-W, 1: NE-SW, 2: N-S, 3: NW-SE neighbours
    off = {0: (0, 1), 1: (1, 1), 2: (1, 0), 3: (1, -1)}
    for d, (di, dj) in off.items():
        m = q == d
        a = np.roll(np.roll(mag, -di, 0), -dj, 1); b = np.roll(np.roll(mag, di, 0), dj, 1)
        keep = m & (mag >= a) & (mag >= b); nms[keep] = mag[keep]
    nms[[0, -1], :] = 0; nms[:, [0, -1]] = 0
    strong = nms >= hi; weak = nms >= lo; edges = strong.copy()
    while True:                                                    # grow strong edges through connected weak pixels
        grown = weak & (np.pad(edges, 1)[0:-2, 0:-2] | np.pad(edges, 1)[0:-2, 1:-1] | np.pad(edges, 1)[0:-2, 2:] |
                        np.pad(edges, 1)[1:-1, 0:-2] | np.pad(edges, 1)[1:-1, 2:] | np.pad(edges, 1)[2:, 0:-2] |
                        np.pad(edges, 1)[2:, 1:-1] | np.pad(edges, 1)[2:, 2:] | edges)
        if (grown == edges).all(): break
        edges = grown
    return edges, mag

def test_sobel_step():
    img = np.zeros((5, 6)); img[:, 3:] = 100
    gx = correlate(img, SOBEL_X)
    print(f"Sobel x across a 100-level vertical step: {gx[2].tolist()}")
    assert gx[2, 2] == 400 and gx[2, 3] == 400 and gx[2, 0] == 0

def test_matches_opencv():
    img = make_image()
    gx = correlate(img, SOBEL_X); blur = correlate(img, gaussian_kernel(1.4, 5))
    edges, mag = canny(img, 40, 100)
    print(f"Canny with thresholds 40 and 100: {edges.sum()} edge pixels")
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    e1 = np.abs(gx - cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)).max()
    e2 = np.abs(blur - cv2.GaussianBlur(img.astype(float), (5, 5), 1.4)).max()
    ref = cv2.Canny(cv2.GaussianBlur(img, (5, 5), 1.4), 40, 100, L2gradient=True) > 0
    near = cv2.dilate(ref.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    agree = (edges & near).sum() / edges.sum(); recall = (ref & (cv2.dilate(edges.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)).sum() / ref.sum()
    print(f"vs cv2.Sobel {e1:.1e}, cv2.GaussianBlur {e2:.1e}; cv2.Canny {ref.sum()} edge pixels, "
          f"{100 * agree:.1f} % of ours within 1 px of OpenCV's and {100 * recall:.1f} % of OpenCV's within 1 px of ours")
    assert e1 < 1e-9 and e2 < 1e-9 and agree > 0.95 and recall > 0.95

def test_edges_on_boundaries():
    img = make_image(); edges, _ = canny(img, 40, 100)
    y, x = np.nonzero(edges)
    on_sq = (np.minimum.reduce([np.abs(y - 29.5), np.abs(y - 79.5)]) <= 2) & (x >= 18) & (x <= 71) | \\
            (np.minimum.reduce([np.abs(x - 19.5), np.abs(x - 69.5)]) <= 2) & (y >= 28) & (y <= 81)
    on_disc = np.abs(np.hypot(x - 115, y - 65) - 28) <= 2
    frac = (on_sq | on_disc).mean()
    print(f"{100 * frac:.1f} % of edge pixels lie within 2 px of a true boundary")
    assert frac > 0.98

test_sobel_step()
test_matches_opencv()
test_edges_on_boundaries()
print("PASS")`}],s={id:e,minutes:40,summary:n,html:r,toc:i,quiz:a,code:o};export{o as code,s as default,r as html,e as id,t as minutes,a as quiz,n as summary,i as toc};