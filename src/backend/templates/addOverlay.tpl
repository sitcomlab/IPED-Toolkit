<div>
  <div class="row">
    <div class="col-xs-10">
      <p class="lead">Add new overlay</p>
    </div>
    <div class="col-xs-2">
      <button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
    </div>
  </div>
  <hr />
  <video id="iPED-Video" autoplay="autoplay" loop="loop">
    <source src="<%= video.get('url') + '.mp4' %>" type="video/mp4">
    <source src="<%= video.get('url') + '.ogg' %>" type="video/ogg">
  </video>
</div>