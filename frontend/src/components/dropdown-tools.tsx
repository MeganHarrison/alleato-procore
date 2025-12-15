          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 items-center gap-2 rounded px-2 text-[hsl(var(--procore-header-text))] hover:bg-brand transition-colors"
              >
                <span className="text-xs text-gray-400">Project Tools</span>
                <span className="ml-2 text-sm font-medium">{currentTool}</span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-screen p-6 rounded-none border-x-0">
              <div className="container mx-auto">
                <div className="grid grid-cols-3 gap-12">
                {/* Core Tools Column */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Core Tools</h3>
                  <div className="space-y-1">
                    {coreTools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setCurrentTool(tool.name)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                      >
                        <span>{tool.name}</span>
                        {tool.badge && (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {tool.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Project Management Column */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Project Management</h3>
                  <div className="space-y-1">
                    {projectManagementTools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setCurrentTool(tool.name)}
                        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          {tool.isFavorite && <Star className="h-3.5 w-3.5 text-gray-400" />}
                          {tool.name}
                          {tool.hasCreateAction && (
                            <Plus className="h-4 w-4 rounded-full bg-orange-500 p-0.5 text-white ml-1" />
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Financial Management Column */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Financial Management</h3>
                  <div className="space-y-1">
                    {financialManagementTools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setCurrentTool(tool.name)}
                        className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          {tool.name}
                          {tool.hasCreateAction && (
                            <Plus className="h-4 w-4 rounded-full bg-orange-500 p-0.5 text-white ml-1" />
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>