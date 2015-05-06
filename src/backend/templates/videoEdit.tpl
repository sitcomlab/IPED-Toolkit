<div>
    <div class="row">
        <div class="col-xs-10">
            <p class="lead">
                <%=title %>
            </p>
        </div>
        <div class="col-xs-2">
            <button type="button" class="close">
                <span aria-hidden="true">&times;</span>
                <span class="sr-only">Close</span>
            </button>
        </div>
    </div>
    <hr />
    <form>
        <table class="table borderless">
            <tbody>
                <tr>
                    <th>Name</th>
                    <td>
                        <input type="text" class="form-control" value="<%= video.get('name') %>" name="name">
                    </td>
                </tr>
                <tr>
                    <th>URL</th>
                    <td>
                        <input type="text" class="form-control" value="<%=video.get( 'url') %>" name="url">
                    </td>
                </tr>
                <tr>
                    <th>Date</th>
                    <td>
                        <input type="text" class="form-control" value="<%=video.get( 'date') %>" name="date">
                    </td>
                </tr>
                <tr>
                    <th>Description</th>
                    <td>
                        <textarea class="form-control" rows="3" name="description" placeholder="Description" style="white-space:nowrap;  word-wrap: normal; overflow:scroll;">
                            <%=video.get('description') %>
                        </textarea>
                    </td>
                </tr>
                <tr>
                    <th>Tags</th>
                    <td>
                        <select multiple data-role="tagsinput" name="tags"></select>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="row">
            <div class="col-sm-6">
                <button type="button" class="btn btn-default cancel" style="display: block; width: 100%;"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Cancel</button>
            </div>
            <div class="col-sm-6">
                <button type="button" class="btn btn-success save" style="display: block; width: 100%;"><span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> Save</button>
            </div>
        </div>
    </form>
</div>
